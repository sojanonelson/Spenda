import { CATEGORIES } from './constants';

export const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(0)}`;

export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const getTodayStr = () => new Date().toISOString().split('T')[0];

export const getCategoryInfo = (categoryName) => {
  return CATEGORIES.find((c) => c.name === categoryName) || CATEGORIES[CATEGORIES.length - 1];
};

export const getBudgetPercentage = (spent, budget) => {
  if (!budget || budget === 0) return 0;
  return Math.min(100, Math.round((spent / budget) * 100));
};

export const getBudgetColor = (percentage) => {
  if (percentage >= 100) return '#ef4444';
  if (percentage >= 90) return '#f97316';
  if (percentage >= 80) return '#f59e0b';
  return '#10b981';
};

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
