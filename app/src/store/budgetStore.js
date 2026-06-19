import { create } from 'zustand';
import { budgetAPI } from '../api';
import { getTodayStr } from '../utils/helpers';

const useBudgetStore = create((set, get) => ({
  summary: null,
  budget: null,
  partnerBudget: null,
  isLoading: false,

  fetchSummary: async (date) => {
    set({ isLoading: true });
    try {
      const res = await budgetAPI.getDashboardSummary({ date: date || getTodayStr() });
      set({ summary: res.data.summary });
    } catch (e) {
      console.error('[Budget] Summary fetch error:', e.message);
    } finally {
      set({ isLoading: false });
    }
  },

  setBudget: async (amount, date) => {
    const res = await budgetAPI.setBudget({ amount, date: date || getTodayStr() });
    set({ budget: res.data.budget });
    // Refresh summary
    await get().fetchSummary(date);
    return res.data.budget;
  },

  fetchBudget: async (date) => {
    try {
      const res = await budgetAPI.getBudget({ date: date || getTodayStr() });
      set({ budget: res.data.budget });
    } catch (e) {
      console.error('[Budget] Fetch error:', e.message);
    }
  },

  fetchPartnerBudget: async (date) => {
    try {
      const res = await budgetAPI.getPartnerBudget({ date: date || getTodayStr() });
      set({ partnerBudget: res.data.budget });
    } catch (e) {
      console.error('[Budget] Partner fetch error:', e.message);
    }
  },

  clearBudget: () => set({ summary: null, budget: null, partnerBudget: null }),
}));

export default useBudgetStore;
