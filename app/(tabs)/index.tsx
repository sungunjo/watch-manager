import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useDashboard, ActivityItem } from '../../src/hooks/useDashboard';
import { NotificationType } from '../../src/types';
import { Colors } from '../../src/constants';
import { getTodayString, formatKoreanDate } from '../../src/utils/date';
import { useDatabase } from '../../src/hooks/useDatabase';

export default function DashboardScreen() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const { loading, data, load } = useDashboard();

  useFocusEffect(
    useCallback(() => {
      if (isReady) load();
    }, [isReady, load])
  );

  const today = getTodayString();

  const getAlertIcon = (type: NotificationType) => {
    if (type === NotificationType.WARRANTY_EXPIRY) return 'shield-outline';
    if (type === NotificationType.OVERHAUL_DUE) return 'build-outline';
    return 'notifications-outline';
  };

  const getAlertColor = (daysUntil: number) => {
    if (daysUntil < 0) return Colors.error;
    if (daysUntil <= 7) return Colors.accent;
    if (daysUntil <= 30) return Colors.warning;
    return Colors.gold;
  };

  const renderActivityIcon = (type: ActivityItem['type']) => {
    if (type === 'WEAR') {
      return (
        <View style={[styles.activityDot, { backgroundColor: Colors.gold }]}>
          <Ionicons name="watch-outline" size={10} color={Colors.background} />
        </View>
      );
    }
    return (
      <View style={[styles.activityDot, { backgroundColor: Colors.info }]}>
        <Ionicons name="build-outline" size={10} color={Colors.background} />
      </View>
    );
  };

  const formatActivityDate = (dateStr: string) => {
    if (dateStr === today) return '오늘';
    const yesterday = new Date(today + 'T00:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return '어제';
    return dateStr.replace(/-/g, '.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Watch Manager</Text>
          <Text style={styles.headerDate}>{formatKoreanDate(today)}</Text>
        </View>
        <TouchableOpacity
          style={styles.notifButton}
          onPress={() => router.push('/more')}
        >
          {data.alerts.length > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {data.alerts.length > 9 ? '9+' : data.alerts.length}
              </Text>
            </View>
          )}
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={Colors.gold}
          />
        }
      >
        {/* 오늘의 시계 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>오늘의 시계</Text>
            <TouchableOpacity
              onPress={() =>
                router.push(`/modals/wear-log-form?date=${today}`)
              }
            >
              <Text style={styles.sectionAction}>+ 기록</Text>
            </TouchableOpacity>
          </View>

          {data.todayLogs.length === 0 ? (
            <TouchableOpacity
              style={styles.todayEmpty}
              onPress={() =>
                router.push(`/modals/wear-log-form?date=${today}`)
              }
            >
              <Ionicons name="watch-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.todayEmptyText}>오늘 착용한 시계를 기록해보세요</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.todayList}
            >
              {data.todayLogs.map((log) => (
                <TouchableOpacity
                  key={log.id}
                  style={styles.todayCard}
                  onPress={() => router.push(`/collection/${log.watchId}`)}
                >
                  {log.coverPhotoUri ? (
                    <Image
                      source={{ uri: log.coverPhotoUri }}
                      style={styles.todayCardPhoto}
                    />
                  ) : (
                    <View style={styles.todayCardPhotoPlaceholder}>
                      <Ionicons
                        name="watch-outline"
                        size={28}
                        color={Colors.textMuted}
                      />
                    </View>
                  )}
                  <Text style={styles.todayCardName} numberOfLines={2}>
                    {log.watchNickname || log.watchModelName}
                  </Text>
                  {log.occasion ? (
                    <View style={styles.todayCardTag}>
                      <Text style={styles.todayCardTagText}>{log.occasion}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 컬렉션 요약 */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/collection')}
          >
            <Text style={styles.statValue}>{data.stats.total}</Text>
            <Text style={styles.statLabel}>총 시계</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/collection')}
          >
            <Text style={[styles.statValue, { color: Colors.gold }]}>
              {data.stats.wearing}
            </Text>
            <Text style={styles.statLabel}>착용중</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.info }]}>
              {data.totalWearThisMonth}
            </Text>
            <Text style={styles.statLabel}>이번달 착용</Text>
          </View>
          <View style={styles.statCard}>
            <Text
              style={[
                styles.statValue,
                data.wearStreakDays > 0 && { color: Colors.success },
              ]}
            >
              {data.wearStreakDays}
            </Text>
            <Text style={styles.statLabel}>연속 착용</Text>
          </View>
        </View>

        {/* 알림 */}
        {data.alerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>알림</Text>
              <Text style={styles.alertCount}>{data.alerts.length}건</Text>
            </View>
            {data.alerts.slice(0, 3).map((alert, index) => (
              <TouchableOpacity
                key={`${alert.type}-${alert.watchId}-${index}`}
                style={styles.alertCard}
                onPress={() => router.push(`/collection/${alert.watchId}`)}
              >
                <View
                  style={[
                    styles.alertIcon,
                    { backgroundColor: getAlertColor(alert.daysUntil) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getAlertIcon(alert.type)}
                    size={16}
                    color={getAlertColor(alert.daysUntil)}
                  />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertWatchName} numberOfLines={1}>
                    {alert.watchName}
                  </Text>
                  <Text
                    style={[
                      styles.alertMessage,
                      { color: getAlertColor(alert.daysUntil) },
                    ]}
                  >
                    {alert.message}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 빠른 액션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 액션</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/modals/watch-form')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent + '20' }]}>
                <Ionicons name="add-circle-outline" size={22} color={Colors.accent} />
              </View>
              <Text style={styles.quickActionLabel}>시계 등록</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() =>
                router.push(`/modals/wear-log-form?date=${today}`)
              }
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.gold + '20' }]}>
                <Ionicons name="camera-outline" size={22} color={Colors.gold} />
              </View>
              <Text style={styles.quickActionLabel}>오착 기록</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/timegrapher')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.info + '20' }]}>
                <Ionicons name="timer-outline" size={22} color={Colors.info} />
              </View>
              <Text style={styles.quickActionLabel}>정밀도 측정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/collection')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.success + '20' }]}>
                <Ionicons name="grid-outline" size={22} color={Colors.success} />
              </View>
              <Text style={styles.quickActionLabel}>컬렉션</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 최근 활동 */}
        {data.recentActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>최근 활동</Text>
            <View style={styles.activityList}>
              {data.recentActivity.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.activityItem}
                  onPress={() => router.push(`/collection/${item.watchId}`)}
                >
                  {renderActivityIcon(item.type)}
                  {idx < data.recentActivity.length - 1 && (
                    <View style={styles.activityLine} />
                  )}
                  <View style={styles.activityContent}>
                    <Text style={styles.activityWatchName} numberOfLines={1}>
                      {item.watchName}
                    </Text>
                    <Text style={styles.activityDesc}>{item.description}</Text>
                  </View>
                  <Text style={styles.activityDate}>
                    {formatActivityDate(item.date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: 0.5 },
  headerDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  notifButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: 3,
  },
  notifBadgeText: { fontSize: 9, color: Colors.text, fontWeight: '700' },

  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionAction: { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  alertCount: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },

  todayEmpty: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  todayEmptyText: { fontSize: 13, color: Colors.textMuted },
  todayList: { gap: 12, paddingRight: 4 },
  todayCard: {
    width: 100,
    alignItems: 'center',
    gap: 6,
  },
  todayCardPhoto: {
    width: 88,
    height: 88,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  todayCardPhotoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCardName: {
    fontSize: 11,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
    maxWidth: 92,
  },
  todayCardTag: {
    backgroundColor: Colors.gold + '30',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayCardTagText: { fontSize: 10, color: Colors.gold, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: { flex: 1 },
  alertWatchName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  alertMessage: { fontSize: 12, marginTop: 2 },

  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  activityList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    position: 'relative',
  },
  activityDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activityLine: {
    position: 'absolute',
    left: 26,
    top: 34,
    width: 2,
    height: 24,
    backgroundColor: Colors.border,
  },
  activityContent: { flex: 1 },
  activityWatchName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  activityDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  activityDate: { fontSize: 11, color: Colors.textMuted },
});
