import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { io } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import useAuthStore from './src/store/authStore';
import useExpenseStore from './src/store/expenseStore';
import useNotificationStore from './src/store/notificationStore';
import useBudgetStore from './src/store/budgetStore';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { COLORS, API_BASE_URL } from './src/utils/constants';
import { authAPI } from './src/api';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register device for Expo push notifications.
 * Returns an ExponentPushToken that is sent to the backend and stored per user.
 * Works in Expo Go (development) AND standalone builds automatically.
 */
async function registerForPushNotifications() {
  // Push notifications only work on real devices
  if (!Device.isDevice) {
    console.log('[Push] Skipping — emulators do not support push notifications');
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission denied by user');
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('spenda', {
      name: 'Spenda Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
      sound: 'default',
    });
  }

  try {
    // Get Expo push token — Expo routes this through FCM (Android) or APNs (iOS)
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('[Push] ✅ Token registered:', token.slice(0, 40) + '...');
    return token;
  } catch (e) {
    console.warn('[Push] Could not get push token:', e.message);
    return null;
  }
}


export default function App() {
  const { isLoading, isAuthenticated, user, hydrate } = useAuthStore();
  const { handlePartnerExpenseUpdate, fetchExpenses, fetchPartnerExpenses } = useExpenseStore();
  const { addNotification, fetchNotifications } = useNotificationStore();
  const { fetchSummary } = useBudgetStore();
  const socketRef = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    hydrate();
  }, []);

  // Register FCM token when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      registerForPushNotifications().then((token) => {
        if (token) {
          authAPI.updateFcmToken(token).catch(() => {});
        }
      });

      // Handle notifications received while app is in FOREGROUND
      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data;
        console.log('[FCM] Foreground notification:', data?.type);

        if (data?.type === 'expense_update') {
          // Re-fetch to get latest data
          const today = new Date().toISOString().split('T')[0];
          fetchPartnerExpenses(today);
          fetchSummary(today);
        } else if (data?.type === 'budget_alert') {
          fetchNotifications();
        }
      });

      // Handle notification TAP (app opened from notification)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
        const today = new Date().toISOString().split('T')[0];
        fetchExpenses(today);
        fetchPartnerExpenses(today);
        fetchSummary(today);
        fetchNotifications();
      });

      return () => {
        Notifications.removeNotificationSubscription(notificationListener.current);
        Notifications.removeNotificationSubscription(responseListener.current);
      };
    }
  }, [isAuthenticated, user]);

  // Socket.IO — instant sync when BOTH users have app open
  useEffect(() => {
    if (isAuthenticated && user) {
      const socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: true });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Socket] Connected:', socket.id);
        socket.emit('register', user.id);
      });

      socket.on('partner_expense_update', (data) => {
        handlePartnerExpenseUpdate(data);
        // Also refresh summary for updated totals
        fetchSummary(new Date().toISOString().split('T')[0]);
      });

      socket.on('notification', (notif) => {
        addNotification(notif);
      });

      socket.on('disconnect', () => {
        console.log('[Socket] Disconnected — FCM will handle background updates');
      });

      return () => { socket.disconnect(); };
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

