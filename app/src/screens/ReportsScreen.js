import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { formatCurrency, getCategoryInfo } from '../utils/helpers';
import { reportAPI } from '../api';

const TABS = ['Daily', 'Weekly', 'Monthly'];

export default function ReportsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Daily');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchReport(); }, [activeTab]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'Daily') res = await reportAPI.getDailyReport({});
      else if (activeTab === 'Weekly') res = await reportAPI.getWeeklyReport({});
      else res = await reportAPI.getMonthlyReport({});
      setReport(res.data.report);
    } catch (e) {
      console.error('[Reports] Error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderDailyReport = () => (
    <View style={styles.reportContent}>
      <View style={styles.summaryRow}>
        <StatBox label="Limit" value={formatCurrency(report.dailyLimit)} color={COLORS.accent} />
        <StatBox label="Spent" value={formatCurrency(report.totalSpent)} color={COLORS.warning} />
        <StatBox label="Saved" value={formatCurrency(report.savings)} color={COLORS.success} />
      </View>
      <Text style={styles.sectionTitle}>Category Breakdown</Text>
      {Object.entries(report.categoryBreakdown || {}).map(([catName, amt]) => {
        const cat = getCategoryInfo(catName);
        const isFoodCategory = ['Breakfast', 'Lunch', 'Dinner'].includes(catName);
        return (
          <View 
            key={catName} 
            style={[
              styles.catRow,
              isFoodCategory && { borderColor: cat.color, backgroundColor: cat.color + '0F' }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
              <Text style={styles.catName}>{catName}</Text>
            </View>
            <Text style={styles.catAmount}>{formatCurrency(amt)}</Text>
          </View>
        );
      })}
    </View>
  );

  const renderWeeklyReport = () => (
    <View style={styles.reportContent}>
      <View style={styles.summaryRow}>
        <StatBox label="Budget" value={formatCurrency(report.totalBudget)} color={COLORS.accent} />
        <StatBox label="Spent" value={formatCurrency(report.totalSpent)} color={COLORS.warning} />
        <StatBox label="Saved" value={formatCurrency(report.weeklySavings)} color={COLORS.success} />
      </View>
      <Text style={styles.sectionTitle}>Daily Breakdown</Text>
      {Object.entries(report.dailyTotals || {}).map(([date, amt]) => (
        <View key={date} style={styles.catRow}>
          <Text style={styles.catName}>{new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
          <Text style={[styles.catAmount, amt === 0 && { color: COLORS.success }]}>{formatCurrency(amt)}</Text>
        </View>
      ))}
    </View>
  );

  const renderMonthlyReport = () => (
    <View style={styles.reportContent}>
      <View style={styles.summaryRow}>
        <StatBox label="Budget" value={formatCurrency(report.totalBudget)} color={COLORS.accent} />
        <StatBox label="Spent" value={formatCurrency(report.totalSpent)} color={COLORS.warning} />
        <StatBox label="Saved" value={formatCurrency(report.monthlySavings)} color={COLORS.success} />
      </View>
      <Text style={styles.sectionTitle}>Category Breakdown</Text>
      {Object.entries(report.categoryBreakdown || {}).map(([catName, amt]) => {
        const pct = report.totalSpent > 0 ? Math.round((amt / report.totalSpent) * 100) : 0;
        const cat = getCategoryInfo(catName);
        const isFoodCategory = ['Breakfast', 'Lunch', 'Dinner'].includes(catName);
        return (
          <View 
            key={catName} 
            style={[
              styles.catRow,
              isFoodCategory && { borderColor: cat.color, backgroundColor: cat.color + '0F' }
            ]}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                <Text style={styles.catName}>{catName}</Text>
              </View>
              <View style={styles.catBar}>
                <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.catAmount}>{formatCurrency(amt)}</Text>
              <Text style={styles.catPct}>{pct}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loading}><ActivityIndicator color={COLORS.primary} size="large" /></View>
        ) : report ? (
          activeTab === 'Daily' ? renderDailyReport() :
          activeTab === 'Weekly' ? renderWeeklyReport() :
          renderMonthlyReport()
        ) : (
          <View style={styles.empty}><Text style={styles.emptyText}>No data available</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  activeTabText: { color: '#fff' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  reportContent: {},
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  catName: { fontSize: 14, color: COLORS.text, fontWeight: '600', marginBottom: 6 },
  catAmount: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  catPct: { fontSize: 11, color: COLORS.textMuted },
  catBar: { height: 4, backgroundColor: COLORS.card, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  catBarFill: { height: '100%', borderRadius: 2 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});
