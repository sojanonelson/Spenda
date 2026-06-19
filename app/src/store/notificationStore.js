import { create } from 'zustand';
import { notificationAPI } from '../api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationAPI.getNotifications();
      set({ notifications: res.data.notifications, unreadCount: res.data.unreadCount });
    } catch (e) {
      console.error('[Notifications] Fetch error:', e.message);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    await notificationAPI.markAsRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await notificationAPI.markAllAsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  deleteNotification: async (id) => {
    await notificationAPI.deleteNotification(id);
    const notif = get().notifications.find((n) => n._id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== id),
      unreadCount: notif && !notif.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }));
  },

  // Add real-time notification from socket
  addNotification: (notif) => {
    set((state) => ({
      notifications: [notif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));

export default useNotificationStore;
