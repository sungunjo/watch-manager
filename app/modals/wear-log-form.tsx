import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useWearLogs } from '../../src/hooks/useWearLogs';
import { useWatches } from '../../src/hooks/useWatches';
import { TextField, SelectField, OptionSheet } from '../../src/components/common/FormField';
import { Button } from '../../src/components/common/Button';
import { Colors } from '../../src/constants';
import { WatchListItem } from '../../src/types';
import { getTodayString } from '../../src/utils/date';

const OCCASION_PRESETS = [
  '출근', '미팅', '여행', '운동', '데이트', '캐주얼', '포멀', '파티', '야외활동', '기타',
];

export default function WearLogFormModal() {
  const router = useRouter();
  const { watchId, date } = useLocalSearchParams<{ watchId?: string; date?: string }>();
  const { createLog, loading } = useWearLogs();
  const { fetchWatches } = useWatches();

  const [watches, setWatches] = useState<WatchListItem[]>([]);
  const [selectedWatchId, setSelectedWatchId] = useState<number | null>(
    watchId ? parseInt(watchId) : null
  );
  const [wearDate, setWearDate] = useState(date || getTodayString());
  const [occasion, setOccasion] = useState('');
  const [strapBand, setStrapBand] = useState('');
  const [notes, setNotes] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWatches({ status: undefined }).then((items) => {
      const active = items.filter((w) =>
        ['WEARING', 'STORED'].includes(w.status)
      );
      setWatches(active);
      if (!selectedWatchId && active.length > 0) {
        setSelectedWatchId(active[0].id);
      }
    });
  }, [fetchWatches]);

  const selectedWatch = watches.find((w) => w.id === selectedWatchId);

  const watchOptions = watches.map((w) => ({
    value: String(w.id),
    label: `${w.brand} ${w.nickname || w.modelName}`,
  }));

  const handleSubmit = async () => {
    if (!selectedWatchId) {
      Alert.alert('오류', '시계를 선택해주세요.');
      return;
    }
    if (!wearDate) {
      Alert.alert('오류', '착용 날짜를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const id = await createLog({
        watchId: selectedWatchId,
        wearDate,
        occasion: occasion.trim() || undefined,
        strapBand: strapBand.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (id) {
        Alert.alert('완료', '오착 기록이 저장되었습니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('오류', '저장에 실패했습니다.');
      }
    } catch {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '오착 기록',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.text,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* 시계 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>오늘의 시계</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.watchRow}
              contentContainerStyle={styles.watchRowContent}
            >
              {watches.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.watchChip,
                    selectedWatchId === w.id && styles.watchChipSelected,
                  ]}
                  onPress={() => setSelectedWatchId(w.id)}
                >
                  {w.coverPhotoUri ? (
                    <Image
                      source={{ uri: w.coverPhotoUri }}
                      style={styles.watchChipImage}
                    />
                  ) : (
                    <View style={styles.watchChipPlaceholder}>
                      <Ionicons name="watch-outline" size={20} color={Colors.textMuted} />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.watchChipText,
                      selectedWatchId === w.id && styles.watchChipTextSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {w.nickname || w.modelName}
                  </Text>
                  {selectedWatchId === w.id && (
                    <View style={styles.watchChipCheck}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.gold} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 착용 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>착용 정보</Text>

            <TextField
              label="착용 날짜"
              required
              value={wearDate}
              onChangeText={setWearDate}
              placeholder="YYYY-MM-DD"
            />

            {/* TPO 프리셋 */}
            <View style={styles.occasionWrapper}>
              <Text style={styles.fieldLabel}>TPO / 상황</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.presetRow}
                contentContainerStyle={styles.presetRowContent}
              >
                {OCCASION_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      occasion === preset && styles.presetChipSelected,
                    ]}
                    onPress={() => setOccasion(occasion === preset ? '' : preset)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        occasion === preset && styles.presetChipTextSelected,
                      ]}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextField
                label=""
                value={occasion}
                onChangeText={setOccasion}
                placeholder="직접 입력 (출근, 여행, 데이트...)"
                style={{ marginTop: 4 }}
              />
            </View>

            <TextField
              label="스트랩 / 브레이슬릿"
              value={strapBand}
              onChangeText={setStrapBand}
              placeholder="브로이슬릿, 나토 스트랩, 러버..."
            />

            <TextField
              label="메모"
              value={notes}
              onChangeText={setNotes}
              placeholder="오늘의 착용 기록..."
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />
          </View>

          <View style={styles.buttons}>
            <Button
              title="취소"
              onPress={() => router.back()}
              variant="outline"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="기록하기"
              onPress={handleSubmit}
              loading={isSubmitting || loading}
              style={{ flex: 2 }}
            />
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  watchRow: { marginBottom: 4 },
  watchRowContent: { paddingRight: 8, gap: 10 },
  watchChip: {
    width: 90,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  watchChipSelected: {},
  watchChipImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  watchChipPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  watchChipText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 80,
  },
  watchChipTextSelected: {
    color: Colors.gold,
    fontWeight: '600',
  },
  watchChipCheck: {
    position: 'absolute',
    top: -4,
    right: 2,
  },
  occasionWrapper: { marginBottom: 8 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  presetRow: { marginBottom: 8 },
  presetRowContent: { gap: 8, paddingRight: 8 },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  presetChipText: { fontSize: 13, color: Colors.textSecondary },
  presetChipTextSelected: { color: Colors.background, fontWeight: '700' },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
