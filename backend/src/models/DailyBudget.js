const mongoose = require('mongoose');

const dailyBudgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
  },
  { timestamps: true }
);

// One budget per user per day
dailyBudgetSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyBudget', dailyBudgetSchema);
