const express = require('express');
const router = express.Router();
const { getDailyReport, getWeeklyReport, getMonthlyReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/daily', getDailyReport);
router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);

module.exports = router;
