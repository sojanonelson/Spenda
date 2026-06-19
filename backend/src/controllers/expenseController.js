const Expense = require('../models/Expense');
const User = require('../models/User');
const DailyBudget = require('../models/DailyBudget');
const Notification = require('../models/Notification');
const { emitExpenseUpdate, emitToUser } = require('../services/socketService');
const { notifyPartnerExpenseUpdate, notifyBudgetThreshold } = require('../services/fcmService');


const getDateRange = (dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  return { start, end };
};

// GET /api/expenses?date=YYYY-MM-DD
const getExpenses = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let query = { userId: req.user._id };

    if (startDate && endDate) {
      query.expenseDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (date) {
      const { start, end } = getDateRange(date);
      query.expenseDate = { $gte: start, $lte: end };
    } else {
      const { start, end } = getDateRange();
      query.expenseDate = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(query).sort({ expenseDate: -1 });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({ success: true, expenses, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/expenses/partner?date=YYYY-MM-DD
const getPartnerExpenses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.partnerId)
      return res.status(404).json({ success: false, message: 'No partner connected' });

    const { date } = req.query;
    const { start, end } = getDateRange(date);

    const expenses = await Expense.find({
      userId: user.partnerId,
      expenseDate: { $gte: start, $lte: end },
    }).sort({ expenseDate: -1 });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ success: true, expenses, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/expenses
const addExpense = async (req, res) => {
  try {
    const { title, amount, category, notes, expenseDate } = req.body;
    if (!title || !amount)
      return res.status(400).json({ success: false, message: 'Title and amount are required' });

    const expense = await Expense.create({
      userId: req.user._id,
      title,
      amount: Number(amount),
      category: category || 'Other',
      notes,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    });

    // Emit to partner in real time (Socket.IO — instant when both online)
    const user = await User.findById(req.user._id);
    if (user.partnerId) {
      emitExpenseUpdate(user.partnerId, 'added', { ...expense.toObject(), userName: user.name });

      // FCM push — works even when Render is sleeping or partner app is in background
      const partner = await User.findById(user.partnerId).select('fcmToken');
      if (partner?.fcmToken) {
        notifyPartnerExpenseUpdate(partner.fcmToken, user.name, 'added', expense).catch(() => {});
      }
    }

    // Budget threshold notifications
    await checkBudgetThreshold(req.user._id, user, expense);

    res.status(201).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const { title, amount, category, notes, expenseDate } = req.body;
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense)
      return res.status(404).json({ success: false, message: 'Expense not found' });

    if (title) expense.title = title;
    if (amount !== undefined) expense.amount = Number(amount);
    if (category) expense.category = category;
    if (notes !== undefined) expense.notes = notes;
    if (expenseDate) expense.expenseDate = new Date(expenseDate);
    await expense.save();

    const user = await User.findById(req.user._id);
    if (user.partnerId) {
      emitExpenseUpdate(user.partnerId, 'updated', { ...expense.toObject(), userName: user.name });

      // FCM push fallback
      const partner = await User.findById(user.partnerId).select('fcmToken');
      if (partner?.fcmToken) {
        notifyPartnerExpenseUpdate(partner.fcmToken, user.name, 'updated', expense).catch(() => {});
      }
    }

    res.json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!expense)
      return res.status(404).json({ success: false, message: 'Expense not found' });

    const user = await User.findById(req.user._id);
    if (user.partnerId) {
      emitExpenseUpdate(user.partnerId, 'deleted', { _id: req.params.id, userName: user.name });

      // FCM push fallback
      const partner = await User.findById(user.partnerId).select('fcmToken');
      if (partner?.fcmToken) {
        notifyPartnerExpenseUpdate(partner.fcmToken, user.name, 'deleted', { _id: req.params.id }).catch(() => {});
      }
    }

    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: check budget threshold and emit notifications
const checkBudgetThreshold = async (userId, user, newExpense) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const budget = await DailyBudget.findOne({ userId, date: today });
    if (!budget || budget.amount === 0) return;

    const { start, end } = getDateRange();
    const expenses = await Expense.find({ userId, expenseDate: { $gte: start, $lte: end } });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const pct = (total / budget.amount) * 100;

    let notifType = null;
    let notifTitle = null;
    let notifMsg = null;

    if (pct >= 100) {
      notifType = 'budget_exceeded';
      notifTitle = '⚠️ Budget Exceeded!';
      notifMsg = `You've spent ₹${total} — exceeding your daily limit of ₹${budget.amount}`;
    } else if (pct >= 90) {
      notifType = 'budget_90';
      notifTitle = '🔶 90% Budget Used';
      notifMsg = `You've used 90% of your daily budget (₹${total} / ₹${budget.amount})`;
    } else if (pct >= 80) {
      notifType = 'budget_80';
      notifTitle = '🔶 80% Budget Used';
      notifMsg = `You've used 80% of your daily budget (₹${total} / ₹${budget.amount})`;
    }

    if (notifType) {
      const notif = await Notification.create({ userId, title: notifTitle, message: notifMsg, type: notifType });
      emitToUser(String(userId), 'notification', notif);

      // FCM push to the user themselves for budget alerts
      const userDoc = await User.findById(userId).select('fcmToken');
      if (userDoc?.fcmToken) {
        notifyBudgetThreshold(userDoc.fcmToken, notifTitle, notifMsg).catch(() => {});
      }

      // Also notify partner
      if (user.partnerId) {
        const partnerNotif = await Notification.create({
          userId: user.partnerId,
          title: `Partner: ${notifTitle}`,
          message: notifMsg,
          type: notifType,
        });
        emitToUser(String(user.partnerId), 'notification', partnerNotif);

        // FCM push to partner
        const partnerDoc = await User.findById(user.partnerId).select('fcmToken');
        if (partnerDoc?.fcmToken) {
          notifyBudgetThreshold(partnerDoc.fcmToken, `Partner: ${notifTitle}`, notifMsg).catch(() => {});
        }
      }
    }
  } catch (e) {
    console.error('[Budget Check] Error:', e.message);
  }
};

module.exports = { getExpenses, getPartnerExpenses, addExpense, updateExpense, deleteExpense };
