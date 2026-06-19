const Expense = require('../models/Expense');
const DailyBudget = require('../models/DailyBudget');
const User = require('../models/User');

// GET /api/reports/daily?date=YYYY-MM-DD
const getDailyReport = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const expenses = await Expense.find({
      userId: req.user._id,
      expenseDate: { $gte: dayStart, $lte: dayEnd },
    }).sort({ expenseDate: -1 });

    const budget = await DailyBudget.findOne({ userId: req.user._id, date });
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const dailyLimit = budget ? budget.amount : 0;
    const savings = Math.max(0, dailyLimit - totalSpent);

    // Category breakdown
    const categoryBreakdown = {};
    expenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    res.json({
      success: true,
      report: { date, totalSpent, dailyLimit, savings, expenses, categoryBreakdown },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/weekly?startDate=YYYY-MM-DD
const getWeeklyReport = async (req, res) => {
  try {
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);

    const expenses = await Expense.find({
      userId: req.user._id,
      expenseDate: { $gte: startDate, $lte: endDate },
    }).sort({ expenseDate: 1 });

    // Group by day
    const dailyTotals = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      dailyTotals[key] = 0;
    }
    expenses.forEach((e) => {
      const key = new Date(e.expenseDate).toISOString().split('T')[0];
      if (dailyTotals[key] !== undefined) dailyTotals[key] += e.amount;
    });

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    // Fetch budgets for the week
    const budgets = await DailyBudget.find({
      userId: req.user._id,
      date: { $gte: startDate.toISOString().split('T')[0], $lte: endDate.toISOString().split('T')[0] },
    });
    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const weeklySavings = Math.max(0, totalBudget - totalSpent);

    res.json({
      success: true,
      report: { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0], dailyTotals, totalSpent, totalBudget, weeklySavings },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/monthly?year=2024&month=6
const getMonthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year || now.getFullYear());
    const month = parseInt(req.query.month || now.getMonth() + 1);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await Expense.find({
      userId: req.user._id,
      expenseDate: { $gte: startDate, $lte: endDate },
    }).sort({ expenseDate: 1 });

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    // Category breakdown
    const categoryBreakdown = {};
    expenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    // Budget total for month
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const budgets = await DailyBudget.find({ userId: req.user._id, date: { $gte: startStr, $lte: endStr } });
    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const monthlySavings = Math.max(0, totalBudget - totalSpent);

    res.json({
      success: true,
      report: { year, month, totalSpent, totalBudget, monthlySavings, categoryBreakdown, expenseCount: expenses.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDailyReport, getWeeklyReport, getMonthlyReport };
