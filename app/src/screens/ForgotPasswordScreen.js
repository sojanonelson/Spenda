import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { authAPI } from '../api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🔐</Text>
        </View>

        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          {sent
            ? 'Check your email for the reset link. It expires in 1 hour.'
            : "Enter your email and we'll send you a reset link."}
        </Text>

        {!sent && (
          <>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>Send Reset Link</Text>}
            </TouchableOpacity>
          </>
        )}

        {sent && (
          <TouchableOpacity style={styles.backToLoginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 24, paddingTop: 48 },
  backBtn: { marginBottom: 32 },
  iconWrap: { alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, marginBottom: 16,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: COLORS.text, paddingVertical: 14, fontSize: 15 },
  sendBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backToLoginBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  backToLoginText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 20 },
  cancelText: { color: COLORS.textSecondary, fontSize: 14 },
});
