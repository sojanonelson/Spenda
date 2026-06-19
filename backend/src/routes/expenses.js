const express = require('express');
const router = express.Router();
const { getExpenses, getPartnerExpenses, addExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getExpenses);
router.get('/partner', getPartnerExpenses);
router.post('/', addExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
