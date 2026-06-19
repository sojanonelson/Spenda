/**
 * Expo Push Notification Service
 *
 * Uses Expo's Push API — completely FREE, no Firebase account needed for Expo Go.
 * Expo routes notifications through FCM (Android) and APNs (iOS) automatically.
 *
 * Token format stored in DB: "ExponentPushToken[xxxxxx]"
 * This works in Expo Go during development AND in production Expo builds.
 *
 * For custom bare React Native builds, swap to FCM directly (see bottom of file).
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a push notification via Expo's free push service.
 * @param {string} expoPushToken  - Token from app: Notifications.getExpoPushTokenAsync()
 * @param {string} title          - Notification title
 * @param {string} body           - Notification body text
 * @param {object} data           - Extra data payload (triggers re-fetch in app)
 */
const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) return;

  // Only send to valid Expo tokens
  const isExpoToken = expoPushToken.startsWith('ExponentPushToken');
  const isFCMToken  = expoPushToken.startsWith('ExponentPushToken') === false && expoPushToken.length > 100;

  if (!isExpoToken && !isFCMToken) {
    console.log('[Push] Invalid token format, skipping');
    return;
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: { ...data, timestamp: Date.now() },
    priority: 'high',
    badge: 1,
  };

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result?.data?.status === 'ok') {
      console.log(`[Push] ✅ Sent: "${title}" → ${expoPushToken.slice(0, 30)}...`);
    } else if (result?.data?.status === 'error') {
      console.warn('[Push] ⚠️ Error:', result.data.message, '| Details:', result.data.details);
    } else {
      console.log('[Push] Response:', JSON.stringify(result));
    }

    return result;
  } catch (error) {
    console.error('[Push] ❌ Failed to send notification:', error.message);
  }
};

// ─── Specific senders for Spenda ─────────────────────────────────────────────

/**
 * Notify partner when expense is added/updated/deleted.
 * App receives this and auto re-fetches partner expenses.
 */
const notifyPartnerExpenseUpdate = async (partnerToken, senderName, action, expense) => {
  const actionMap = { added: 'added', updated: 'updated', deleted: 'deleted' };
  const title = `💰 Expense ${actionMap[action] || action}`;
  const body = action === 'deleted'
    ? `${senderName} deleted an expense`
    : `${senderName} ${action} ₹${expense?.amount} on ${expense?.category}`;

  return sendPushNotification(partnerToken, title, body, {
    type: 'expense_update',
    action,
    expenseId: String(expense?._id || ''),
    senderName,
  });
};

/**
 * Notify user (and/or partner) about budget threshold breach.
 */
const notifyBudgetThreshold = async (token, title, message) => {
  return sendPushNotification(token, title, message, { type: 'budget_alert' });
};

/**
 * Notify user that their partner invitation was accepted.
 */
const notifyPartnerConnected = async (token, partnerName) => {
  return sendPushNotification(
    token,
    '🎉 Partner Connected!',
    `${partnerName} accepted your Spenda invitation!`,
    { type: 'partner_connected', partnerName }
  );
};

module.exports = {
  sendPushNotification,
  notifyPartnerExpenseUpdate,
  notifyBudgetThreshold,
  notifyPartnerConnected,
};
