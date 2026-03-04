import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useWearLogs } from '../../../src/hooks/useWearLogs';
import { WearLog } from '../../../src/types';
import { Colors } from '../../../src/constants';
import {
  getCalendarDays,
  formatKoreanMonth,
  formatKoreanDate,
  getTodayString,
} from '../../../src/utils/date';

type WearLogWithWatch = WearLog & {
  watchBrand: string;
  watchModelName: string;
  coverPhotoUri?: string;
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function WotdScreen() {
  const router = useRouter();
  const { fetchDatesWithLogs, fetchByDate, removeLog } = useWearLogs();

  const today = getTodayString();
  const todayDate = new Date(today + 'T00:00:00');

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [datesWithLogs, setDatesWithLogs] = useState<Set<string>>(new Set());
  const [selectedLogs, setSelectedLogs] = useState<WearLogWithWatch[]>([]);

  const calendarDays = getCalendarDays(year, month);

  const loadDatesWithLogs = useCallback(async () => {
    const dates = await fetchDatesWithLogs(year, month);
    setDatesWithLogs(new Set(dates));
  }, [fetchDatesWithLogs, year, month]);

  const loadLogsForDate = useCallback(
    async (date: string) => {
      const logs = await fetchByDate(date);
      setSelectedLogs(logs as WearLogWithWatch[]);
    },
    [fetchByDate]
  );

  useFocusEffect(
    useCallback(() => {
      loadDatesWithLogs();
      loadLogsForDate(selectedDate);
    }, [loadDatesWithLogs, loadLogsForDate, selectedDate])
  );

  useEffect(() => {
    loadDatesWithLogs();
  }, [loadDatesWithLogs]);

  useEffect(() => {
    loadLogsForDate(selectedDate);
  }, [loadLogsForDate, selectedDate]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleDayPress = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  };

  const handleDeleteLog = (log: WearLogWithWatch) => {
    Alert.alert('기록 삭제', '이 착용 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await removeLog(log.id);
          await loadLogsForDate(selectedDate);
          await loadDatesWithLogs();
        },
      },
    ]);
  };

  const isToday = (date: Date) => {
    return date.toISOString().split('T')[0] === today;
  };

  const isSelected = (date: Date) => {
    return date.toISOString().split('T')[0] === selectedDate;
  };

  const hasLog = (date: Date) => {
    return datesWithLogs.has(date.toISOString().split('T')[0]);
  };

  const renderCalendarDay = (day: Date | null, index: number) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.dayCell} />;
    }

    const dayOfWeek = day.getDay();
    const selected = isSelected(day);
    const todayFlag = isToday(day);
    const hasWearLog = hasLog(day);

    return (
      <TouchableOpacity
        key={day.toISOString()}
        style={[styles.dayCell, selected && styles.dayCellSelected]}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dayText,
            dayOfWeek === 0 && styles.dayTextSunday,
            dayOfWeek === 6 && styles.dayTextSaturday,
            todayFlag && styles.dayTextToday,
            selected && styles.dayTextSelected,
          ]}
        >
          {day.getDate()}
        </Text>
        {hasWearLog && (
          <View
            style={[styles.logDot, selected && styles.logDotSelected]}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderLogItem = ({ item }: { item: WearLogWithWatch }) => (
    <View style={styles.logCard}>
      {item.coverPhotoUri ? (
        <Image source={{ uri: item.coverPhotoUri }} style={styles.logPhoto} />
      ) : (
        <View style={styles.logPhotoPlaceholder}>
          <Ionicons name="watch-outline" size={24} color={Colors.textMuted} />
        </View>
      )}
      <View style={styles.logInfo}>
        <Text style={styles.logWatchName} numberOfLines={1}>
          {item.watchBrand} {item.watchModelName}
        </Text>
        <View style={styles.logMeta}>
          {item.occasion ? (
            <View style={styles.logTag}>
              <Text style={styles.logTagText}>{item.occasion}</Text>
            </View>
          ) : null}
          {item.strapBand ? (
            <Text style={styles.logMetaText} numberOfLines={1}>
              {item.strapBand}
            </Text>
          ) : null}
        </View>
        {item.notes ? (
          <Text style={styles.logNotes} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.logDeleteBtn}
        onPress={() => handleDeleteLog(item)}
      >
        <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>오착 기록</Text>
          <Text style={styles.headerSubtitle}>Watch of the Day</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            router.push(`/modals/wear-log-form?date=${selectedDate}`)
          }
        >
          <Ionicons name="add" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 캘린더 */}
        <View style={styles.calendarCard}>
          {/* 월 네비게이션 */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={handlePrevMonth}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {formatKoreanMonth(year, month)}
            </Text>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={handleNextMonth}
            >
              <Ionicons name="chevron-forward" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* 요일 헤더 */}
          <View style={styles.weekHeader}>
            {DAY_LABELS.map((label, i) => (
              <Text
                key={label}
                style={[
                  styles.weekLabel,
                  i === 0 && styles.weekLabelSunday,
                  i === 6 && styles.weekLabelSaturday,
                ]}
              >
                {label}
              </Text>
            ))}
          </View>

          {/* 날짜 그리드 */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) =>
              renderCalendarDay(day, index)
            )}
          </View>
        </View>

        {/* 선택된 날짜의 착용 기록 */}
        <View style={styles.logsSection}>
          <View style={styles.logsSectionHeader}>
            <Text style={styles.logsSectionTitle}>
              {formatKoreanDate(selectedDate)}
            </Text>
            <Text style={styles.logsCount}>
              {selectedLogs.length > 0
                ? `${selectedLogs.length}개 기록`
                : '기록 없음'}
            </Text>
          </View>

          {selectedLogs.length === 0 ? (
            <View style={styles.emptyLogs}>
              <Ionicons
                name="watch-outline"
                size={40}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyLogsText}>착용 기록이 없습니다</Text>
              <TouchableOpacity
                style={styles.emptyLogsAction}
                onPress={() =>
                  router.push(`/modals/wear-log-form?date=${selectedDate}`)
                }
              >
                <Text style={styles.emptyLogsActionText}>기록 추가하기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedLogs.map((log) => (
              <View key={log.id}>{renderLogItem({ item: log })}</View>
            ))
          )}
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSubtitle: { fontSize: 11, color: Colors.gold, marginTop: 2 },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarCard: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },

  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    paddingVertical: 4,
  },
  weekLabelSunday: { color: '#e05555' },
  weekLabelSaturday: { color: '#5588e0' },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: Colors.gold,
  },
  dayText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dayTextSunday: { color: '#e05555' },
  dayTextSaturday: { color: '#5588e0' },
  dayTextToday: {
    color: Colors.gold,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: Colors.background,
    fontWeight: '700',
  },
  logDot: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  logDotSelected: {
    backgroundColor: Colors.background,
  },

  logsSection: {
    paddingHorizontal: 16,
  },
  logsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  logsCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  logCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  logPhoto: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 12,
  },
  logPhotoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logInfo: { flex: 1 },
  logWatchName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  logTag: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  logTagText: { fontSize: 11, color: Colors.gold, fontWeight: '600' },
  logMetaText: { fontSize: 12, color: Colors.textSecondary },
  logNotes: { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },
  logDeleteBtn: { padding: 4, marginLeft: 4 },

  emptyLogs: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyLogsText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  emptyLogsAction: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gold,
    marginTop: 4,
  },
  emptyLogsActionText: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '600',
  },
});
