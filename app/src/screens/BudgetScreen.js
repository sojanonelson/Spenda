import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { formatCurrency, getTodayStr, getBudgetPercentage, getBudgetColor } from '../utils/helpers';
import useBudgetStore from '../store/budgetStore';

const PRESETS = [100, 200, 300, 500, 1000, 1500, 2000, 5000];

export default function BudgetScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { budget, setBudget, fetchBudget, summary } = useBudgetStore();

  useEffect(() => {
    fetchBudget(getTodayStr());
  }, []);

  useEffect(() => {
    if (budget?.amount) setAmount(String(budget.amount));
  }, [budget]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0)
      return Alert.alert('Error', 'Please enter a valid amount');

    setLoading(true);
    try {
      await setBudget(Number(amount), getTodayStr());
      Alert.alert('Success', `Daily budget set to ₹${amount}`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to set budget');
    } finally {
      setLoading(false);
    }
  };

  const self = summary?.self;
  const pct = self ? getBudgetPercentage(self.spent, self.budget) : 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Daily Budget</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Current Status */}
        {self && (
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Today's Status</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: getBudgetColor(pct) }]} />
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusItem}>Spent: <Text style={styles.statusValue}>{formatCurrency(self.spent)}</Text></Text>
              <Text style={styles.statusItem}>Saved: <Text style={[styles.statusValue, { color: COLORS.success }]}>{formatCurrency(self.saved)}</Text></Text>
            </View>
          </View>
        )}

        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Set Daily Limit</Text>
          <View style={styles.amountWrap}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />
          </View>
        </View>

        {/* Presets */}
        <Text style={styles.presetsLabel}>Quick Select</Text>
        <View style={styles.presetsGrid}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.presetBtn, amount === String(p) && styles.presetBtnActive]}
              onPress={() => setAmount(String(p))}
            >
              <Text style={[styles.presetText, amount === String(p) && styles.presetTextActive]}>
                ₹{p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.accent} />
          <Text style={styles.tipText}>
            Setting a daily budget helps track savings. Savings = Limit − Spent
          </Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Budget</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, marginBottom: 32 },
  backBtn: {},
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  statusCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  statusLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 12 },
  progressBg: { height: 8, backgroundColor: COLORS.card, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 4 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { fontSize: 13, color: COLORS.textMuted },
  statusValue: { fontWeight: '700', color: COLORS.text },
  amountSection: { alignItems: 'center', marginBottom: 32 },
  amountLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16, fontWeight: '600' },
  amountWrap: { flexDirection: 'row', alignItems: 'center' },
  currency: { fontSize: 36, color: COLORS.textSecondary, fontWeight: '700', marginRight: 4 },
  amountInput: { fontSize: 56, fontWeight: '800', color: COLORS.text, minWidth: 100 },
  presetsLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 12 },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  presetBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  presetBtnActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  presetText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  presetTextActive: { color: COLORS.primary },
  tip: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 24 },
  tipText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
