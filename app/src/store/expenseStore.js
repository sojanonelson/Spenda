import { create } from 'zustand';
import { expenseAPI } from '../api';
import { getTodayStr } from '../utils/helpers';

const useExpenseStore = create((set, get) => ({
  expenses: [],
  partnerExpenses: [],
  isLoading: false,
  selectedDate: getTodayStr(),

  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchExpenses: async (date) => {
    set({ isLoading: true });
    try {
      const d = date || get().selectedDate;
      const res = await expenseAPI.getExpenses({ date: d });
      set({ expenses: res.data.expenses });
    } catch (e) {
      console.error('[Expense] Fetch error:', e.message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPartnerExpenses: async (date) => {
    try {
      const d = date || get().selectedDate;
      const res = await expenseAPI.getPartnerExpenses({ date: d });
      set({ partnerExpenses: res.data.expenses });
    } catch (e) {
      // 404 = no partner connected yet — this is normal for new users, not an error
      if (e.response?.status === 404) {
        set({ partnerExpenses: [] });
      } else {
        console.error('[Expense] Partner fetch error:', e.message);
      }
    }
  },


  addExpense: async (data) => {
    const res = await expenseAPI.addExpense(data);
    set((state) => ({ expenses: [res.data.expense, ...state.expenses] }));
    return res.data.expense;
  },

  updateExpense: async (id, data) => {
    const res = await expenseAPI.updateExpense(id, data);
    set((state) => ({
      expenses: state.expenses.map((e) => (e._id === id ? res.data.expense : e)),
    }));
    return res.data.expense;
  },

  deleteExpense: async (id) => {
    await expenseAPI.deleteExpense(id);
    set((state) => ({ expenses: state.expenses.filter((e) => e._id !== id) }));
  },

  // Called when partner updates an expense via socket
  handlePartnerExpenseUpdate: ({ action, expense }) => {
    if (action === 'added') {
      set((state) => ({ partnerExpenses: [expense, ...state.partnerExpenses] }));
    } else if (action === 'updated') {
      set((state) => ({
        partnerExpenses: state.partnerExpenses.map((e) => (e._id === expense._id ? expense : e)),
      }));
    } else if (action === 'deleted') {
      set((state) => ({
        partnerExpenses: state.partnerExpenses.filter((e) => e._id !== expense._id),
      }));
    }
  },

  getTotalSpent: () => get().expenses.reduce((s, e) => s + e.amount, 0),
  getPartnerTotalSpent: () => get().partnerExpenses.reduce((s, e) => s + e.amount, 0),

  clearExpenses: () => set({ expenses: [], partnerExpenses: [] }),
}));

export default useExpenseStore;
