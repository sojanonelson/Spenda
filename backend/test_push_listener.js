const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const { sendPushNotification } = require('./src/services/fcmService');

const MONGO_URI = process.env.MONGO_URI;
console.log('[Listener] Connecting to MongoDB...');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('[Listener] Connected to MongoDB. Waiting for a user to register an FCM/Push token...');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    
    const interval = setInterval(async () => {
      try {
        const users = await User.find({ fcmToken: { $ne: null } });
        if (users.length > 0) {
          clearInterval(interval);
          console.log(`[Listener] Found ${users.length} user(s) with registered tokens!`);
          
          for (const user of users) {
            const token = user.get('fcmToken');
            const name = user.get('name') || 'User';
            console.log(`[Listener] Sending test push to ${name} (${user.get('email')}) at token: ${token.slice(0, 40)}...`);
            
            await sendPushNotification(
              token,
              '🎉 Push Notifications Working!',
              `Hi ${name}! Spenda notifications are set up correctly.`,
              { type: 'test' }
            );
          }
          
          mongoose.connection.close();
          console.log('[Listener] Finished successfully.');
          process.exit(0);
        }
      } catch (err) {
        console.error('[Listener] Error during poll:', err);
      }
    }, 2000);
  })
  .catch(err => {
    console.error('[Listener] Connection error:', err);
    process.exit(1);
  });
