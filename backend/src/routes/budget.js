const express = require('express');
const router = express.Router();
const { getBudget, setBudget, getPartnerBudget, getDashboardSummary } = require('../controllers/budgetController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getBudget);
router.post('/', setBudget);
router.get('/partner', getPartnerBudget);
router.get('/summary', getDashboardSummary);

module.exports = router;
