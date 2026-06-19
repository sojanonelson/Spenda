import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { formatCurrency, getTodayStr, getBudgetPercentage, getBudgetColor, getCategoryInfo } from '../utils/helpers';
import useAuthStore from '../store/authStore';
import useBudgetStore from '../store/budgetStore';
import useExpenseStore from '../store/expenseStore';
import useNotificationStore from '../store/notificationStore';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const { summary, isLoading, fetchSummary } = useBudgetStore();
  const { expenses, partnerExpenses, fetchExpenses, fetchPartnerExpenses } = useExpenseStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  const loadData = useCallback(async () => {
    const today = getTodayStr();
    const calls = [fetchSummary(today), fetchExpenses(today), fetchNotifications()];
    // Only fetch partner expenses if user has a partner
    if (user?.partnerId) calls.push(fetchPartnerExpenses(today));
    await Promise.all(calls);
  }, [user?.partnerId]);


  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const self = summary?.self || { budget: 0, spent: 0, saved: 0 };
  const partner = summary?.partner || null;
  const combined = summary?.combined || { budget: 0, spent: 0, saved: 0 };
  const selfPct = getBudgetPercentage(self.spent, self.budget);

  const recentExpenses = expenses.slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* My Summary Card */}
      <View style={styles.myCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>My Budget Today</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
            <Text style={styles.editBudget}>Edit</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.budgetAmount}>{formatCurrency(self.budget)}</Text>

        {/* Progress Bar */}
        <View style={styles.progressBg}>
          <View
            style={[styles.progressFill, {
              width: `${selfPct}%`,
              backgroundColor: getBudgetColor(selfPct),
            }]}
          />
        </View>
        <Text style={styles.progressLabel}>{selfPct}% used</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(self.spent)}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{formatCurrency(self.saved)}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.accent }]}>{formatCurrency(Math.max(0, self.budget - self.spent))}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      </View>

      {/* Partner Card */}
      {partner ? (
        <View style={styles.partnerCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>👥 Partner</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(partner.budget)}</Text>
              <Text style={styles.statLabel}>Limit</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>{formatCurrency(partner.spent)}</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{formatCurrency(partner.saved)}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.inviteCard} onPress={() => navigation.navigate('InvitePartner')}>
          <Ionicons name="person-add-outline" size={28} color={COLORS.accent} />
          <Text style={styles.inviteTitle}>Invite Your Partner</Text>
          <Text style={styles.inviteSubtitle}>Connect to see combined savings</Text>
        </TouchableOpacity>
      )}

      {/* Combined Card */}
      {partner && (
        <View style={styles.combinedCard}>
          <Text style={styles.combinedTitle}>🏠 Combined Today</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(combined.budget)}</Text>
              <Text style={styles.statLabel}>Total Budget</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>{formatCurrency(combined.spent)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{formatCurrency(combined.saved)}</Text>
              <Text style={styles.statLabel}>Total Saved</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Add */}
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddExpense')}>
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.addBtnText}>Add Expense</Text>
      </TouchableOpacity>

      {/* Recent Expenses */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No expenses today</Text>
          </View>
        ) : (
          recentExpenses.map((expense) => {
            const cat = getCategoryInfo(expense.category);
            const isFoodCategory = ['Breakfast', 'Lunch', 'Dinner'].includes(expense.category);
            return (
              <View 
                key={expense._id} 
                style={[
                  styles.expenseItem,
                  isFoodCategory && {
                    borderColor: cat.color,
                    borderWidth: 1.5,
                    backgroundColor: cat.color + '0F', // very subtle tint
                  }
                ]}
              >
                <View style={styles.expenseLeft}>
                  <Text style={styles.expenseEmoji}>{cat.icon}</Text>
                  <View>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <Text style={styles.expenseCategory}>{expense.category}</Text>
                  </View>
                </View>
                <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function getCategoryEmoji(cat) {
  const map = { Breakfast: '🍳', Lunch: '🍱', Dinner: '🍽️', Travel: '🚗', Shopping: '🛍️', Medical: '💊', Entertainment: '🎮', Education: '📚', Utilities: '⚡', Other: '📌' };
  return map[cat] || '📌';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 48, marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  date: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  notifBtn: { position: 'relative', padding: 4 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.danger, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  myCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  editBudget: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  budgetAmount: { fontSize: 36, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  progressBg: { height: 8, backgroundColor: COLORS.card, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  partnerCard: { backgroundColor: COLORS.cardAlt, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  inviteCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  inviteTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  inviteSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  combinedCard: { backgroundColor: '#1a2640', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2d4a7a' },
  combinedTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  recentSection: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  emptyState: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  expenseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  expenseEmoji: { fontSize: 24 },
  expenseTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  expenseCategory: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: COLORS.text },
});
