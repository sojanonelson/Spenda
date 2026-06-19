import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { formatDate } from '../utils/helpers';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import useBudgetStore from '../store/budgetStore';
import useExpenseStore from '../store/expenseStore';
import { userAPI, invitationAPI } from '../api';

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { clearBudget } = useBudgetStore();
  const { clearExpenses } = useExpenseStore();
  const [partner, setPartner] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingPartner, setLoadingPartner] = useState(false);

  useEffect(() => {
    fetchPartner();
    fetchPendingInvites();
    fetchNotifications();
  }, []);

  const fetchPartner = async () => {
    if (!user?.partnerId) return;
    setLoadingPartner(true);
    try {
      const res = await userAPI.getPartnerProfile();
      setPartner(res.data.partner);
    } catch (e) {} finally {
      setLoadingPartner(false);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      const res = await invitationAPI.getPendingInvitations();
      setPendingInvites(res.data.invitations);
    } catch (e) {}
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      await invitationAPI.acceptInvitation(inviteId);
      await refreshUser();
      setPendingInvites([]);
      fetchPartner();
      Alert.alert('🎉 Connected!', 'You are now connected with your partner!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to accept');
    }
  };

  const handleUnlinkPartner = () => {
    Alert.alert('Unlink Partner', 'Are you sure you want to disconnect from your partner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlink',
        style: 'destructive',
        onPress: async () => {
          await userAPI.unlinkPartner();
          await refreshUser();
          setPartner(null);
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          clearBudget();
          clearExpenses();
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={[styles.verifiedBadge, !user?.isEmailVerified && styles.unverifiedBadge]}>
          <Ionicons name={user?.isEmailVerified ? 'checkmark-circle' : 'alert-circle'} size={14} color={user?.isEmailVerified ? COLORS.success : COLORS.warning} />
          <Text style={[styles.verifiedText, !user?.isEmailVerified && { color: COLORS.warning }]}>
            {user?.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
          </Text>
        </View>
      </View>

      {/* Pending Invitations */}
      {pendingInvites.map((inv) => (
        <View key={inv._id} style={styles.inviteCard}>
          <Text style={styles.inviteTitle}>🤝 Partner Invitation</Text>
          <Text style={styles.inviteMsg}><Text style={styles.inviteName}>{inv.senderId?.name}</Text> invited you to be their Spenda partner!</Text>
          <View style={styles.inviteBtns}>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptInvite(inv._id)}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => invitationAPI.rejectInvitation(inv._id).then(() => setPendingInvites([]))}>
              <Text style={styles.rejectBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Partner Card */}
      {user?.partnerId ? (
        <View style={styles.partnerCard}>
          <Text style={styles.sectionTitle}>👥 Partner</Text>
          {loadingPartner ? <ActivityIndicator color={COLORS.primary} /> : partner ? (
            <>
              <View style={styles.partnerRow}>
                <View style={[styles.avatarCircle, styles.partnerAvatar]}>
                  <Text style={styles.avatarText}>{partner.name?.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  <Text style={styles.partnerEmail}>{partner.email}</Text>
                  <Text style={styles.partnerSince}>Since {formatDate(partner.createdAt)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleUnlinkPartner} style={styles.unlinkBtn}>
                <Text style={styles.unlinkText}>Unlink Partner</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      ) : (
        <TouchableOpacity style={styles.invitePartnerCard} onPress={() => navigation.navigate('InvitePartner')}>
          <Ionicons name="person-add-outline" size={24} color={COLORS.accent} />
          <View>
            <Text style={styles.invitePartnerTitle}>Invite Your Partner</Text>
            <Text style={styles.invitePartnerSub}>Track expenses together</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}

      {/* Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Budget')}>
          <Ionicons name="wallet-outline" size={20} color={COLORS.accent} />
          <Text style={styles.settingLabel}>Set Daily Budget</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={styles.settingDivider} />
        <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('InvitePartner')}>
          <Ionicons name="people-outline" size={20} color={COLORS.accent} />
          <Text style={styles.settingLabel}>Invite Partner</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Spenda v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  notifBtn: { position: 'relative', padding: 4 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.danger, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  userCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  userEmail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, backgroundColor: COLORS.success + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  unverifiedBadge: { backgroundColor: COLORS.warning + '22' },
  verifiedText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  inviteCard: { backgroundColor: COLORS.primary + '11', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.primary + '44' },
  inviteTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  inviteMsg: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 20 },
  inviteName: { fontWeight: '700', color: COLORS.text },
  inviteBtns: { flexDirection: 'row', gap: 12 },
  acceptBtn: { flex: 1, backgroundColor: COLORS.success, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '700' },
  rejectBtn: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  rejectBtnText: { color: COLORS.textSecondary, fontWeight: '600' },
  partnerCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  partnerAvatar: { width: 52, height: 52, borderRadius: 26 },
  partnerName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  partnerEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  partnerSince: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  unlinkBtn: { paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger + '44', borderRadius: 10 },
  unlinkText: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },
  invitePartnerCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  invitePartnerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  invitePartnerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  settingsCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  settingLabel: { flex: 1, fontSize: 15, color: COLORS.text },
  settingDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: 14, paddingVertical: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.danger + '44' },
  logoutText: { color: COLORS.danger, fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted },
});
