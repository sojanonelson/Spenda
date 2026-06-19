const express = require('express');
const router = express.Router();
const { register, login, googleAuth, verifyEmail, forgotPassword, resetPassword, getMe, updateFcmToken } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/fcm-token', protect, updateFcmToken);

module.exports = router;
