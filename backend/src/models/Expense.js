const mongoose = require('mongoose');

const CATEGORIES = [
  'Breakfast', 'Lunch', 'Dinner', 'Travel', 'Shopping',
  'Medical', 'Entertainment', 'Education', 'Utilities', 'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    notes: { type: String, trim: true, default: '' },
    expenseDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Index for date-based queries
expenseSchema.index({ userId: 1, expenseDate: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
