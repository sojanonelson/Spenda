const express = require('express');
const router = express.Router();
const { getPartnerProfile, updateProfile, unlinkPartner } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/partner', getPartnerProfile);
router.put('/profile', updateProfile);
router.delete('/partner', unlinkPartner);

module.exports = router;
