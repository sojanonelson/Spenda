import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CATEGORIES } from '../utils/constants';
import { formatCurrency, formatTime, getCategoryInfo, getTodayStr } from '../utils/helpers';
import useExpenseStore from '../store/expenseStore';
import useBudgetStore from '../store/budgetStore';
import useAuthStore from '../store/authStore';

export default function ExpensesScreen({ navigation }) {
  const { expenses, partnerExpenses, isLoading, fetchExpenses, fetchPartnerExpenses, deleteExpense } = useExpenseStore();
  const { fetchSummary } = useBudgetStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('mine');

  useFocusEffect(
    useCallback(() => {
      const today = getTodayStr();
      fetchExpenses(today);
      // Only fetch partner expenses if user has a connected partner
      if (user?.partnerId) fetchPartnerExpenses(today);
    }, [user?.partnerId])
  );

  const handleDelete = (id) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(id);
          await fetchSummary(getTodayStr());
        },
      },
    ]);
  };

  const displayedExpenses = activeTab === 'mine' ? expenses : partnerExpenses;
  const totalSpent = displayedExpenses.reduce((s, e) => s + e.amount, 0);

  const renderExpense = ({ item }) => {
    const cat = getCategoryInfo(item.category);
    const isFoodCategory = ['Breakfast', 'Lunch', 'Dinner'].includes(item.category);
    return (
      <View 
        style={[
          styles.expenseCard,
          isFoodCategory && {
            borderColor: cat.color,
            borderWidth: 1.5,
            backgroundColor: cat.color + '0F', // very subtle tint (approx 6% opacity)
          }
        ]}
      >
        <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
          <Text style={styles.catEmoji}>{cat.icon}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle}>{item.title}</Text>
          <View style={styles.expenseMeta}>
            <View style={[styles.catBadge, { backgroundColor: cat.color + '22' }]}>
              <Text style={[styles.catBadgeText, { color: cat.color }]}>{item.category}</Text>
            </View>
            <Text style={styles.expenseTime}>{formatTime(item.expenseDate)}</Text>
          </View>
          {item.notes ? <Text style={styles.expenseNotes} numberOfLines={1}>{item.notes}</Text> : null}
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
          {activeTab === 'mine' && (
            <View style={styles.expenseActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddExpense', { expense: item })}
                style={styles.actionBtn}
              >
                <Ionicons name="pencil-outline" size={14} color={COLORS.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddExpense')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['mine', 'partner'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'mine' ? '👤 Mine' : '👥 Partner'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total Today</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(totalSpent)}</Text>
        <Text style={styles.summaryCount}>{displayedExpenses.length} expenses</Text>
      </View>

      {/* List */}
      <FlatList
        data={displayedExpenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              fetchExpenses(getTodayStr());
              if (user?.partnerId) fetchPartnerExpenses(getTodayStr());
            }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{activeTab === 'partner' && !user?.partnerId ? '👥' : '🧾'}</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'partner' && !user?.partnerId ? 'No partner connected' : 'No expenses yet'}
            </Text>
            <Text style={styles.emptySubText}>
              {activeTab === 'mine'
                ? 'Add your first expense today'
                : !user?.partnerId
                ? 'Go to Profile to invite your partner'
                : 'Your partner has no expenses today'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  addBtn: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  activeTabText: { color: '#fff' },
  summary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12, gap: 12 },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryAmount: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  summaryCount: { fontSize: 13, color: COLORS.textMuted },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  expenseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  catIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 22 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 11, fontWeight: '600' },
  expenseTime: { fontSize: 11, color: COLORS.textMuted },
  expenseNotes: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  expenseRight: { alignItems: 'flex-end', gap: 6 },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  expenseActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySubText: { fontSize: 13, color: COLORS.textMuted, marginTop: 6, textAlign: 'center' },
});
