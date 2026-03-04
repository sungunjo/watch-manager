import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useMeasurements } from '../../../src/hooks/useMeasurements';
import { useWatches } from '../../../src/hooks/useWatches';
import { DailyRateChart } from '../../../src/components/measurement/DailyRateChart';
import { Colors } from '../../../src/constants';
import { WatchListItem, Measurement } from '../../../src/types';
import { formatRelativeDate, formatDailyRate } from '../../../src/utils/calculation';
import { useDatabase } from '../../../src/hooks/useDatabase';

export default function TimegrapherScreen() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const { fetchWatches } = useWatches();
  const { fetchByWatchId, removeMeasurement } = useMeasurements();

  const [watches, setWatches] = useState<WatchListItem[]>([]);
  const [selectedWatchId, setSelectedWatchId] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      fetchWatches().then((items) => {
        // 기계식, 스프링 드라이브만 표시
        const mechanical = items.filter((w) =>
          ['MECHANICAL_AUTO', 'MECHANICAL_HAND_WIND', 'SPRING_DRIVE'].includes(w.movementType)
        );
        setWatches(mechanical);
        if (mechanical.length > 0 && !selectedWatchId) {
          setSelectedWatchId(mechanical[0].id);
        }
      });
    }, [isReady, fetchWatches])
  );

  useCallback(() => {
    if (selectedWatchId) {
      fetchByWatchId(selectedWatchId).then(setMeasurements);
    }
  }, [selectedWatchId, fetchByWatchId]);

  // selectedWatchId 변경시 측정 기록 로드
  React.useEffect(() => {
    if (selectedWatchId) {
      fetchByWatchId(selectedWatchId).then(setMeasurements);
    }
  }, [selectedWatchId, fetchByWatchId]);

  const selectedWatch = watches.find((w) => w.id === selectedWatchId);

  const handleDeleteMeasurement = (id: number) => {
    Alert.alert('측정 기록 삭제', '이 측정 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await removeMeasurement(id);
          if (selectedWatchId) {
            const updated = await fetchByWatchId(selectedWatchId);
            setMeasurements(updated);
          }
        },
      },
    ]);
  };

  const completedMeasurements = measurements.filter((m) => m.dailyRateSec !== undefined);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Timegrapher</Text>
          <Text style={styles.headerSubtitle}>정밀도 측정 이력</Text>
        </View>
        <TouchableOpacity
          style={styles.measureBtn}
          onPress={() =>
            router.push(
              selectedWatchId
                ? `/modals/measurement?watchId=${selectedWatchId}`
                : '/modals/measurement'
            )
          }
        >
          <Ionicons name="add" size={18} color={Colors.text} />
          <Text style={styles.measureBtnText}>측정</Text>
        </TouchableOpacity>
      </View>

      {/* 시계 선택 탭 */}
      {watches.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.watchTabs}
          contentContainerStyle={styles.watchTabsContent}
        >
          {watches.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={[styles.watchTab, selectedWatchId === w.id && styles.watchTabActive]}
              onPress={() => setSelectedWatchId(w.id)}
            >
              <Text
                style={[
                  styles.watchTabText,
                  selectedWatchId === w.id && styles.watchTabTextActive,
                ]}
                numberOfLines={1}
              >
                {w.nickname || `${w.brand} ${w.modelName}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.scroll}>
        {watches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="watch-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>기계식 시계가 없습니다</Text>
            <Text style={styles.emptyDesc}>
              컬렉션에 기계식 시계를 등록하면{'\n'}정밀도를 측정할 수 있습니다
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/modals/watch-form')}
            >
              <Text style={styles.emptyBtnText}>시계 등록하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {/* 차트 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>일차 변화 추이</Text>
              <DailyRateChart
                measurements={completedMeasurements}
                height={220}
              />
            </View>

            {/* 측정 이력 목록 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                측정 이력 ({completedMeasurements.length}회)
              </Text>
              {completedMeasurements.length === 0 ? (
                <View style={styles.noMeasure}>
                  <Text style={styles.noMeasureText}>
                    아직 측정 기록이 없습니다.{'\n'}상단 [측정] 버튼을 눌러 시작하세요.
                  </Text>
                </View>
              ) : (
                completedMeasurements.map((m) => (
                  <MeasurementRow
                    key={m.id}
                    measurement={m}
                    onDelete={() => handleDeleteMeasurement(m.id)}
                  />
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MeasurementRow({
  measurement,
  onDelete,
}: {
  measurement: Measurement;
  onDelete: () => void;
}) {
  const rate = measurement.dailyRateSec ?? 0;
  const isPositive = rate >= 0;
  const rateColor =
    Math.abs(rate) <= 4
      ? Colors.success
      : Math.abs(rate) <= 10
      ? Colors.warning
      : Colors.error;

  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.rateContainer}>
        <Text style={[rowStyles.rate, { color: rateColor }]}>
          {rate >= 0 ? '+' : ''}{rate.toFixed(2)}
        </Text>
        <Text style={rowStyles.rateUnit}>s/day</Text>
      </View>
      <View style={rowStyles.info}>
        <Text style={rowStyles.date}>
          {formatRelativeDate(measurement.measurementDate)}
        </Text>
        <Text style={rowStyles.position}>
          {measurement.position?.replace('_', ' ') ?? ''}
        </Text>
        {measurement.notes && (
          <Text style={rowStyles.notes} numberOfLines={1}>
            {measurement.notes}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} style={rowStyles.deleteBtn}>
        <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
  },
  rateContainer: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 60,
  },
  rate: {
    fontSize: 18,
    fontWeight: '700',
  },
  rateUnit: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  position: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  notes: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  deleteBtn: {
    padding: 6,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  headerSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  measureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  measureBtnText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  watchTabs: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    maxHeight: 44,
  },
  watchTabsContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  watchTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  watchTabActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  watchTabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    maxWidth: 120,
  },
  watchTabTextActive: {
    color: Colors.background,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  content: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  noMeasure: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
  },
  noMeasureText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: { color: Colors.text, fontWeight: '600', fontSize: 14 },
});
