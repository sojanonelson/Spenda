import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CATEGORIES } from '../utils/constants';
import { getTodayStr } from '../utils/helpers';
import useExpenseStore from '../store/expenseStore';
import useBudgetStore from '../store/budgetStore';

export default function AddExpenseScreen({ route, navigation }) {
  const editingExpense = route.params?.expense;
  const [title, setTitle] = useState(editingExpense?.title || '');
  const [amount, setAmount] = useState(editingExpense?.amount?.toString() || '');
  const [category, setCategory] = useState(editingExpense?.category || 'Other');
  const [notes, setNotes] = useState(editingExpense?.notes || '');
  const [loading, setLoading] = useState(false);
  const { addExpense, updateExpense } = useExpenseStore();
  const { fetchSummary } = useBudgetStore();

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Please enter a title');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return Alert.alert('Error', 'Please enter a valid amount');

    setLoading(true);
    try {
      const data = { title: title.trim(), amount: Number(amount), category, notes: notes.trim() };
      if (editingExpense) {
        await updateExpense(editingExpense._id, data);
      } else {
        await addExpense({ ...data, expenseDate: new Date().toISOString() });
      }
      await fetchSummary(getTodayStr());
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  // Quick amount presets
  const presets = [10, 25, 50, 100, 200, 500];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={COLORS.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            autoFocus={!editingExpense}
          />
        </View>

        {/* Presets */}
        <View style={styles.presets}>
          {presets.map((p) => (
            <TouchableOpacity key={p} style={styles.presetBtn} onPress={() => setAmount(String(p))}>
              <Text style={styles.presetText}>+₹{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Lunch at restaurant"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isFoodCategory = ['Breakfast', 'Lunch', 'Dinner'].includes(cat.name);
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={[
                      styles.categoryItem,
                      isFoodCategory && { borderColor: cat.color + '44' }, // Highlight food categories subtly with an outline
                      category === cat.name && { backgroundColor: cat.color + '33', borderColor: cat.color, borderWidth: 1.5 },
                    ]}
                    onPress={() => setCategory(cat.name)}
                  >
                    <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                    <Text style={[styles.categoryLabel, category === cat.name && { color: cat.color }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add a note..."
              placeholderTextColor={COLORS.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.saveBtnText}>{editingExpense ? 'Update Expense' : 'Add Expense'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 24 },
  closeBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  saveText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  amountSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  currencySymbol: { fontSize: 40, fontWeight: '700', color: COLORS.textSecondary, marginRight: 8 },
  amountInput: { fontSize: 56, fontWeight: '800', color: COLORS.text, minWidth: 80 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 },
  presetBtn: { backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  presetText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  form: { gap: 16 },
  inputGroup: {},
  label: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  categoryEmoji: { fontSize: 16 },
  categoryLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
