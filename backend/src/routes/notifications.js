const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');
const { sendPushNotification } = require('../services/fcmService');
const User = require('../models/User');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// POST /api/notifications/test-push — send yourself a test push notification
router.post('/test-push', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('fcmToken name');
    if (!user.fcmToken)
      return res.status(400).json({ success: false, message: 'No push token registered. Open the app first.' });

    await sendPushNotification(
      user.fcmToken,
      '🎉 Push Notifications Working!',
      `Hi ${user.name}! Spenda notifications are set up correctly.`,
      { type: 'test' }
    );

    res.json({ success: true, message: 'Test notification sent!', token: user.fcmToken.slice(0, 30) + '...' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;

