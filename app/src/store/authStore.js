import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  // Hydrate from storage on app load
  hydrate: async () => {
    try {
      const token = await AsyncStorage.getItem('spenda_token');
      const userStr = await AsyncStorage.getItem('spenda_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      }
    } catch (e) {
      console.error('[Auth] Hydrate error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { token, user } = res.data;
    await AsyncStorage.setItem('spenda_token', token);
    await AsyncStorage.setItem('spenda_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
    return res.data;
  },

  login: async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    await AsyncStorage.setItem('spenda_token', token);
    await AsyncStorage.setItem('spenda_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
    return res.data;
  },

  googleLogin: async (googleData) => {
    const res = await authAPI.googleAuth(googleData);
    const { token, user } = res.data;
    await AsyncStorage.setItem('spenda_token', token);
    await AsyncStorage.setItem('spenda_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
    return res.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('spenda_token');
    await AsyncStorage.removeItem('spenda_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    try {
      const res = await authAPI.getMe();
      const user = res.data.user;
      await AsyncStorage.setItem('spenda_user', JSON.stringify(user));
      set({ user });
    } catch (e) {
      console.error('[Auth] Refresh user error:', e.message);
    }
  },

  updateUser: (updates) => {
    const user = { ...get().user, ...updates };
    set({ user });
    AsyncStorage.setItem('spenda_user', JSON.stringify(user));
  },
}));

export default useAuthStore;
