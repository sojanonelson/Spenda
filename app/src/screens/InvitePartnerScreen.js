import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { invitationAPI } from '../api';
import useAuthStore from '../store/authStore';

export default function InvitePartnerScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentInvites, setSentInvites] = useState([]);
  const { user } = useAuthStore();

  const fetchSentInvites = useCallback(async () => {
    try {
      const res = await invitationAPI.getSentInvitations();
      setSentInvites(res.data.invitations);
    } catch (e) {
      console.error('[InvitePartner] Fetch sent error:', e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSentInvites();
    }, [fetchSentInvites])
  );

  const handleSend = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Please enter an email address');
    if (email.trim() === user?.email) return Alert.alert('Error', 'You cannot invite yourself');

    setLoading(true);
    try {
      await invitationAPI.sendInvitation(email.trim());
      setSent(true);
      fetchSentInvites();
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.message || 'Could not send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Invite Partner</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🤝</Text>
          <Text style={styles.heroTitle}>Connect with your partner</Text>
          <Text style={styles.heroSubtitle}>
            Track expenses together, monitor shared savings, and stay within budget as a team.
          </Text>
        </View>

        {!sent ? (
          <View style={styles.form}>
            <Text style={styles.label}>Partner's Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="partner@email.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
            </View>

            <View style={styles.features}>
              {['View each other\'s expenses', 'Track combined savings', 'Get budget alerts together', 'Real-time sync'].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={styles.sendBtnText}>Send Invitation</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Sent Invitations list */}
            {sentInvites.length > 0 && (
              <View style={styles.sentSection}>
                <Text style={styles.sectionTitle}>Sent Invitations</Text>
                {sentInvites.map((inv) => {
                  const isAccepted = inv.status === 'accepted';
                  const isRejected = inv.status === 'rejected';
                  return (
                    <View key={inv._id} style={styles.sentCard}>
                      <View style={styles.sentInfo}>
                        <Text style={styles.sentEmail} numberOfLines={1}>{inv.receiverEmail}</Text>
                        <Text style={styles.sentDate}>
                          Sent on {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge, 
                        isAccepted && styles.statusAccepted,
                        isRejected && styles.statusRejected
                      ]}>
                        <Text style={[
                          styles.statusText,
                          isAccepted && { color: COLORS.success },
                          isRejected && { color: COLORS.danger }
                        ]}>
                          {inv.status === 'pending' ? '⏳ Pending' : isAccepted ? '✅ Accepted' : '❌ Rejected'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={styles.successTitle}>Invitation Sent!</Text>
            <Text style={styles.successMsg}>
              An invitation email was sent to <Text style={styles.emailHighlight}>{email}</Text>.{'\n'}
              Ask them to check their inbox and accept the invitation.
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
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
  hero: { alignItems: 'center', marginBottom: 32 },
  heroEmoji: { fontSize: 64, marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 8 },
  form: {},
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, marginBottom: 24 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: COLORS.text, paddingVertical: 14, fontSize: 15 },
  features: { gap: 12, marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, color: COLORS.textSecondary },
  sendBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  successEmoji: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  successMsg: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  emailHighlight: { color: COLORS.accent, fontWeight: '700' },
  doneBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 24 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  // Sent invitations list styles
  sentSection: { marginTop: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  sentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  sentInfo: { flex: 1 },
  sentEmail: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  sentDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.warning + '1A' },
  statusAccepted: { backgroundColor: COLORS.success + '1A' },
  statusRejected: { backgroundColor: COLORS.danger + '1A' },
  statusText: { fontSize: 12, fontWeight: '700', color: COLORS.warning },
});
