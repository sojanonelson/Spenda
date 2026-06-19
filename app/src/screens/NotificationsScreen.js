import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { timeAgo } from '../utils/helpers';
import useNotificationStore from '../store/notificationStore';

const NOTIF_ICONS = {
  expense_added: { icon: 'receipt-outline', color: COLORS.primary },
  budget_80: { icon: 'warning-outline', color: COLORS.warning },
  budget_90: { icon: 'warning-outline', color: '#f97316' },
  budget_exceeded: { icon: 'alert-circle-outline', color: COLORS.danger },
  partner_connected: { icon: 'people-outline', color: COLORS.success },
  invitation: { icon: 'mail-outline', color: COLORS.accent },
  general: { icon: 'notifications-outline', color: COLORS.textSecondary },
};

export default function NotificationsScreen({ navigation }) {
  const { notifications, isLoading, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();

  useEffect(() => { fetchNotifications(); }, []);

  const renderNotification = ({ item }) => {
    const config = NOTIF_ICONS[item.type] || NOTIF_ICONS.general;
    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.isRead && styles.unreadCard]}
        onPress={() => !item.isRead && markAsRead(item._id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: config.color + '22' }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.notifBody}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifMsg}>{item.message}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
        <TouchableOpacity onPress={() => deleteNotification(item._id)} style={styles.deleteBtn}>
          <Ionicons name="close" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchNotifications} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  backBtn: {},
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  markAll: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  unreadCard: { borderColor: COLORS.primary + '44', backgroundColor: COLORS.primary + '11' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  notifMsg: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  notifTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4 },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingTop: 100 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.textMuted },
});
