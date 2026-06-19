const DailyBudget = require('../models/DailyBudget');
const Expense = require('../models/Expense');
const User = require('../models/User');

const getTodayStr = () => new Date().toISOString().split('T')[0];

// GET /api/budget?date=YYYY-MM-DD
const getBudget = async (req, res) => {
  try {
    const date = req.query.date || getTodayStr();
    let budget = await DailyBudget.findOne({ userId: req.user._id, date });

    // If no budget set for today, return 0
    if (!budget) {
      // Look for most recent budget and carry forward
      const last = await DailyBudget.findOne({ userId: req.user._id }).sort({ date: -1 });
      budget = last ? { ...last.toObject(), date } : { userId: req.user._id, amount: 0, date };
    }

    res.json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/budget
const setBudget = async (req, res) => {
  try {
    const { amount, date } = req.body;
    if (amount === undefined || amount < 0)
      return res.status(400).json({ success: false, message: 'Valid amount is required' });

    const budgetDate = date || getTodayStr();
    const budget = await DailyBudget.findOneAndUpdate(
      { userId: req.user._id, date: budgetDate },
      { amount: Number(amount) },
      { upsert: true, new: true }
    );

    res.json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/budget/partner
const getPartnerBudget = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.partnerId)
      return res.status(404).json({ success: false, message: 'No partner connected' });

    const date = req.query.date || getTodayStr();
    const budget = await DailyBudget.findOne({ userId: user.partnerId, date });

    res.json({ success: true, budget: budget || { userId: user.partnerId, amount: 0, date } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/budget/summary — combined dashboard data
const getDashboardSummary = async (req, res) => {
  try {
    const date = req.query.date || getTodayStr();
    const user = await User.findById(req.user._id);

    // Self
    const selfBudget = await DailyBudget.findOne({ userId: req.user._id, date });
    const selfBudgetAmount = selfBudget ? selfBudget.amount : 0;

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const selfExpenses = await Expense.find({
      userId: req.user._id,
      expenseDate: { $gte: dayStart, $lte: dayEnd },
    });
    const selfSpent = selfExpenses.reduce((s, e) => s + e.amount, 0);
    const selfSaved = Math.max(0, selfBudgetAmount - selfSpent);

    let partnerData = null;
    if (user.partnerId) {
      const partnerBudget = await DailyBudget.findOne({ userId: user.partnerId, date });
      const partnerBudgetAmount = partnerBudget ? partnerBudget.amount : 0;
      const partnerExpenses = await Expense.find({
        userId: user.partnerId,
        expenseDate: { $gte: dayStart, $lte: dayEnd },
      });
      const partnerSpent = partnerExpenses.reduce((s, e) => s + e.amount, 0);
      const partnerSaved = Math.max(0, partnerBudgetAmount - partnerSpent);
      partnerData = { budget: partnerBudgetAmount, spent: partnerSpent, saved: partnerSaved };
    }

    const combinedBudget = selfBudgetAmount + (partnerData?.budget || 0);
    const combinedSpent = selfSpent + (partnerData?.spent || 0);
    const combinedSaved = selfSaved + (partnerData?.saved || 0);

    res.json({
      success: true,
      summary: {
        self: { budget: selfBudgetAmount, spent: selfSpent, saved: selfSaved },
        partner: partnerData,
        combined: { budget: combinedBudget, spent: combinedSpent, saved: combinedSaved },
        date,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBudget, setBudget, getPartnerBudget, getDashboardSummary };
