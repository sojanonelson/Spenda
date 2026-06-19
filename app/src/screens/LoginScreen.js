import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import useAuthStore from '../store/authStore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  // Load remembered email on component mount
  useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('spenda_remembered_email');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (e) {
        console.error('[Login] Error loading remembered email:', e);
      }
    };
    loadRememberedEmail();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Error', 'Please fill in all fields');
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Save or clear email based on Remember Me checkbox
      if (rememberMe) {
        await AsyncStorage.setItem('spenda_remembered_email', email.trim());
      } else {
        await AsyncStorage.removeItem('spenda_remembered_email');
      }
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>💰</Text>
          </View>
          <Text style={styles.title}>Spenda</Text>
          <Text style={styles.subtitle}>Track expenses together</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome Back</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password Row */}
          <View style={styles.rememberForgotRow}>
            <TouchableOpacity style={styles.rememberMeBtn} onPress={() => setRememberMe(!rememberMe)}>
              <Ionicons 
                name={rememberMe ? "checkbox" : "square-outline"} 
                size={18} 
                color={rememberMe ? COLORS.primary : COLORS.textMuted} 
              />
              <Text style={styles.rememberMeText}>Remember Me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerLabel}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: 24 },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2, borderColor: COLORS.primary,
  },
  logoText: { fontSize: 36 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: COLORS.text, paddingVertical: 14, fontSize: 15 },
  eyeBtn: { padding: 4 },
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberMeText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  forgotText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  loginBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerLabel: { color: COLORS.textSecondary, fontSize: 14 },
  registerLink: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
});
