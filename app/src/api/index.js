import apiClient from './client';

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  googleAuth: (data) => apiClient.post('/auth/google', data),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  getMe: () => apiClient.get('/auth/me'),
  updateFcmToken: (fcmToken) => apiClient.put('/auth/update-fcm-token', { fcmToken }),
};

export const expenseAPI = {
  getExpenses: (params) => apiClient.get('/expenses', { params }),
  getPartnerExpenses: (params) => apiClient.get('/expenses/partner', { params }),
  addExpense: (data) => apiClient.post('/expenses', data),
  updateExpense: (id, data) => apiClient.put(`/expenses/${id}`, data),
  deleteExpense: (id) => apiClient.delete(`/expenses/${id}`),
};

export const budgetAPI = {
  getBudget: (params) => apiClient.get('/budget', { params }),
  setBudget: (data) => apiClient.post('/budget', data),
  getPartnerBudget: (params) => apiClient.get('/budget/partner', { params }),
  getDashboardSummary: (params) => apiClient.get('/budget/summary', { params }),
};

export const invitationAPI = {
  sendInvitation: (receiverEmail) => apiClient.post('/invitations/send', { receiverEmail }),
  acceptInvitation: (invitationId) => apiClient.post('/invitations/accept', { invitationId }),
  rejectInvitation: (invitationId) => apiClient.post('/invitations/reject', { invitationId }),
  getPendingInvitations: () => apiClient.get('/invitations/pending'),
  getSentInvitations: () => apiClient.get('/invitations/sent'),
};

export const reportAPI = {
  getDailyReport: (params) => apiClient.get('/reports/daily', { params }),
  getWeeklyReport: (params) => apiClient.get('/reports/weekly', { params }),
  getMonthlyReport: (params) => apiClient.get('/reports/monthly', { params }),
};

export const notificationAPI = {
  getNotifications: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
  deleteNotification: (id) => apiClient.delete(`/notifications/${id}`),
};

export const userAPI = {
  getPartnerProfile: () => apiClient.get('/users/partner'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  unlinkPartner: () => apiClient.delete('/users/partner'),
};
