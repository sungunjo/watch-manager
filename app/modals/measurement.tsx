import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useMeasurements } from '../../src/hooks/useMeasurements';
import { useWatches } from '../../src/hooks/useWatches';
import { Colors, POSITION_LABELS } from '../../src/constants';
import { MeasurementPosition } from '../../src/types';
import { formatDateTime, formatTime } from '../../src/utils/calculation';
import { OptionSheet } from '../../src/components/common/FormField';
import { Button } from '../../src/components/common/Button';

type Step = 'start' | 'waiting' | 'end' | 'result';

export default function MeasurementModal() {
  const router = useRouter();
  const { watchId } = useLocalSearchParams<{ watchId?: string }>();
  const { fetchWatchById } = useWatches();
  const { startMeasurement, completeMeasurement, loading } = useMeasurements();

  const [watchName, setWatchName] = useState('');
  const [step, setStep] = useState<Step>('start');
  const [measurementId, setMeasurementId] = useState<number | null>(null);

  // 시작 단계 입력
  const [refStartTime, setRefStartTime] = useState('');
  const [watchStartTime, setWatchStartTime] = useState('');
  const [position, setPosition] = useState<MeasurementPosition>(MeasurementPosition.DIAL_UP);
  const [sheetVisible, setSheetVisible] = useState(false);

  // 종료 단계 입력
  const [refEndTime, setRefEndTime] = useState('');
  const [watchEndTime, setWatchEndTime] = useState('');
  const [notes, setNotes] = useState('');

  // 결과
  const [dailyRate, setDailyRate] = useState<number | null>(null);
  const [elapsedHours, setElapsedHours] = useState(0);

  // 타이머 (경과 시간 표시)
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsedText, setElapsedText] = useState('00:00:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (watchId) {
      fetchWatchById(parseInt(watchId)).then((w) => {
        if (w) setWatchName(`${w.brand} ${w.nickname || w.modelName}`);
      });
    }
  }, [watchId]);

  useEffect(() => {
    if (step === 'waiting' && startedAt) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt.getTime();
        const h = Math.floor(elapsed / 3600000);
        const m = Math.floor((elapsed % 3600000) / 60000);
        const s = Math.floor((elapsed % 60000) / 1000);
        setElapsedText(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        );
        setElapsedHours(elapsed / 3600000);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, startedAt]);

  const setCurrentRefTime = () => {
    setRefStartTime(new Date().toISOString());
  };

  const setCurrentRefEndTime = () => {
    setRefEndTime(new Date().toISOString());
  };

  const handleStart = async () => {
    if (!watchId) {
      Alert.alert('오류', '시계를 선택해주세요.');
      return;
    }
    if (!watchStartTime) {
      Alert.alert('오류', '시계 시각을 입력해주세요.');
      return;
    }

    const refTime = refStartTime || new Date().toISOString();
    const id = await startMeasurement(
      parseInt(watchId),
      watchStartTime,
      refTime,
      position
    );

    if (id) {
      setMeasurementId(id);
      setStartedAt(new Date());
      setStep('waiting');
    } else {
      Alert.alert('오류', '측정 시작에 실패했습니다.');
    }
  };

  const handleEnd = async () => {
    if (!measurementId) return;
    if (!watchEndTime) {
      Alert.alert('오류', '시계 종료 시각을 입력해주세요.');
      return;
    }
    if (elapsedHours < 1) {
      Alert.alert(
        '주의',
        '1시간 미만의 측정은 정확도가 낮습니다. 계속하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '계속', onPress: () => completeNow() },
        ]
      );
      return;
    }
    await completeNow();
  };

  const completeNow = async () => {
    if (!measurementId) return;
    const refEnd = refEndTime || new Date().toISOString();
    const result = await completeMeasurement(measurementId, watchEndTime, refEnd, notes);
    if (result) {
      setDailyRate(result.dailyRate);
      setStep('result');
    } else {
      Alert.alert('오류', '측정 완료에 실패했습니다.');
    }
  };

  const POSITION_OPTIONS = Object.entries(POSITION_LABELS).map(([value, label]) => ({
    value: value as MeasurementPosition,
    label,
  }));

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Timegrapher 측정',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.text,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* 시계 이름 */}
          {watchName && (
            <View style={styles.watchBanner}>
              <Ionicons name="watch-outline" size={18} color={Colors.gold} />
              <Text style={styles.watchBannerText}>{watchName}</Text>
            </View>
          )}

          {/* STEP 1: 측정 시작 */}
          {step === 'start' && (
            <View style={styles.stepCard}>
              <StepIndicator current={1} total={3} />
              <Text style={styles.stepTitle}>측정 시작</Text>
              <Text style={styles.stepDesc}>
                기준 시각(스마트폰 시각)과 시계 시각을 입력하고 측정을 시작합니다.
                최소 1시간, 권장 24시간 이상 측정하세요.
              </Text>

              <View style={styles.timeInputGroup}>
                <Text style={styles.timeGroupLabel}>기준 시각 (스마트폰)</Text>
                <View style={styles.timeRow}>
                  <Text style={styles.timeDisplay}>
                    {refStartTime
                      ? formatDateTime(new Date(refStartTime))
                      : '—'}
                  </Text>
                  <TouchableOpacity style={styles.nowBtn} onPress={setCurrentRefTime}>
                    <Ionicons name="time" size={14} color={Colors.gold} />
                    <Text style={styles.nowBtnText}>현재 시각</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.timeInputGroup}>
                <Text style={styles.timeGroupLabel}>시계 시각 (직접 입력)</Text>
                <TextInput
                  style={styles.timeInput}
                  value={watchStartTime}
                  onChangeText={setWatchStartTime}
                  placeholder="HH:MM:SS (예: 14:35:42)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                />
                <Text style={styles.timeHint}>
                  시계를 보고 현재 표시된 시각을 정확히 입력하세요
                </Text>
              </View>

              <View style={styles.positionGroup}>
                <Text style={styles.timeGroupLabel}>포지션</Text>
                <TouchableOpacity
                  style={styles.positionSelect}
                  onPress={() => setSheetVisible(true)}
                >
                  <Text style={styles.positionText}>{POSITION_LABELS[position]}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Button
                title="측정 시작하기"
                onPress={handleStart}
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginTop: 24 }}
              />
            </View>
          )}

          {/* STEP 2: 측정 중 */}
          {step === 'waiting' && (
            <View style={styles.stepCard}>
              <StepIndicator current={2} total={3} />
              <Text style={styles.stepTitle}>측정 중</Text>

              <View style={styles.timerDisplay}>
                <Text style={styles.timerText}>{elapsedText}</Text>
                <Text style={styles.timerLabel}>경과 시간</Text>
                {elapsedHours < 1 && (
                  <View style={styles.warningBadge}>
                    <Ionicons name="warning" size={12} color={Colors.warning} />
                    <Text style={styles.warningText}>최소 1시간 측정 권장</Text>
                  </View>
                )}
                {elapsedHours >= 24 && (
                  <View style={styles.goodBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                    <Text style={styles.goodText}>24시간 이상 — 정밀 측정</Text>
                  </View>
                )}
              </View>

              <Text style={styles.waitingDesc}>
                시계를 움직이지 않고 보관하세요.{'\n'}
                충분한 시간이 지난 후 "측정 종료"를 눌러주세요.
              </Text>

              <Button
                title="측정 종료하기"
                onPress={() => setStep('end')}
                variant="outline"
                fullWidth
                size="lg"
                style={{ marginTop: 24 }}
              />
            </View>
          )}

          {/* STEP 3: 종료 시각 입력 */}
          {step === 'end' && (
            <View style={styles.stepCard}>
              <StepIndicator current={3} total={3} />
              <Text style={styles.stepTitle}>측정 종료</Text>
              <Text style={styles.stepDesc}>
                종료 기준 시각과 현재 시계가 가리키는 시각을 입력하세요.
              </Text>

              <View style={styles.timeInputGroup}>
                <Text style={styles.timeGroupLabel}>기준 종료 시각 (스마트폰)</Text>
                <View style={styles.timeRow}>
                  <Text style={styles.timeDisplay}>
                    {refEndTime
                      ? formatDateTime(new Date(refEndTime))
                      : '—'}
                  </Text>
                  <TouchableOpacity style={styles.nowBtn} onPress={setCurrentRefEndTime}>
                    <Ionicons name="time" size={14} color={Colors.gold} />
                    <Text style={styles.nowBtnText}>현재 시각</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.timeInputGroup}>
                <Text style={styles.timeGroupLabel}>시계 종료 시각 (직접 입력)</Text>
                <TextInput
                  style={styles.timeInput}
                  value={watchEndTime}
                  onChangeText={setWatchEndTime}
                  placeholder="HH:MM:SS (예: 14:52:18)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View style={styles.timeInputGroup}>
                <Text style={styles.timeGroupLabel}>메모 (선택)</Text>
                <TextInput
                  style={[styles.timeInput, { height: 80, textAlignVertical: 'top' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="착용 포지션, 컨디션 등 기록"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </View>

              <Button
                title="일차 계산하기"
                onPress={handleEnd}
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginTop: 24 }}
              />
            </View>
          )}

          {/* RESULT */}
          {step === 'result' && dailyRate !== null && (
            <View style={styles.resultCard}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              <Text style={styles.resultTitle}>측정 완료!</Text>

              <View style={styles.rateDisplay}>
                <Text style={styles.rateSign}>{dailyRate >= 0 ? '+' : ''}</Text>
                <Text style={styles.rateValue}>{dailyRate.toFixed(2)}</Text>
                <Text style={styles.rateUnit}>sec/day</Text>
              </View>

              <Text style={styles.rateDesc}>
                {Math.abs(dailyRate) <= 4
                  ? '훌륭한 정밀도입니다! (COSC 기준 내)'
                  : Math.abs(dailyRate) <= 10
                  ? '양호한 정밀도입니다'
                  : Math.abs(dailyRate) <= 30
                  ? '기계식 시계 일반 허용 범위입니다'
                  : '레귤레이션을 고려해보세요'}
              </Text>

              <RatingBar rate={dailyRate} />

              <Button
                title="완료"
                onPress={() => router.back()}
                fullWidth
                size="lg"
                style={{ marginTop: 24 }}
              />
            </View>
          )}
        </ScrollView>

        <OptionSheet
          visible={sheetVisible}
          title="측정 포지션"
          options={POSITION_OPTIONS}
          selectedValue={position}
          onSelect={(v) => setPosition(v)}
          onClose={() => setSheetVisible(false)}
        />
      </SafeAreaView>
    </>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={indicatorStyles.row}>
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <View
            style={[
              indicatorStyles.dot,
              i + 1 === current && indicatorStyles.dotCurrent,
              i + 1 < current && indicatorStyles.dotDone,
            ]}
          >
            {i + 1 < current ? (
              <Ionicons name="checkmark" size={10} color={Colors.background} />
            ) : (
              <Text style={indicatorStyles.dotNum}>{i + 1}</Text>
            )}
          </View>
          {i < total - 1 && (
            <View style={[indicatorStyles.line, i + 1 < current && indicatorStyles.lineDone]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

function RatingBar({ rate }: { rate: number }) {
  const absRate = Math.abs(rate);
  // -30 ~ +30 범위를 바로 표시
  const position = Math.min(1, Math.max(0, (rate + 30) / 60));

  return (
    <View style={ratingStyles.container}>
      <View style={ratingStyles.bar}>
        <View style={[ratingStyles.indicator, { left: `${position * 100}%` as unknown as number }]} />
        <View style={ratingStyles.centerLine} />
      </View>
      <View style={ratingStyles.labels}>
        <Text style={ratingStyles.label}>-30s</Text>
        <Text style={ratingStyles.label}>0</Text>
        <Text style={ratingStyles.label}>+30s</Text>
      </View>
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrent: { backgroundColor: Colors.gold },
  dotDone: { backgroundColor: Colors.success },
  dotNum: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  line: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  lineDone: { backgroundColor: Colors.success },
});

const ratingStyles = StyleSheet.create({
  container: { width: '100%', marginTop: 16 },
  bar: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
  },
  indicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.gold,
    marginLeft: -8,
    zIndex: 1,
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: Colors.textSecondary,
    marginLeft: -1,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: { fontSize: 11, color: Colors.textMuted },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  watchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  watchBannerText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  stepCard: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  timeInputGroup: { marginBottom: 16 },
  timeGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: 14,
    paddingRight: 8,
    minHeight: 44,
  },
  timeDisplay: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  nowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  nowBtnText: { fontSize: 12, color: Colors.gold, fontWeight: '600' },
  timeInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 44,
  },
  timeHint: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  positionGroup: { marginBottom: 4 },
  positionSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  positionText: { fontSize: 14, color: Colors.text },
  // Waiting
  timerDisplay: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '200',
    color: Colors.gold,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: { fontSize: 12, color: Colors.textMuted },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  warningText: { fontSize: 12, color: Colors.warning },
  goodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  goodText: { fontSize: 12, color: Colors.success },
  waitingDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Result
  resultCard: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  resultTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  rateDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 8,
  },
  rateSign: { fontSize: 28, color: Colors.textSecondary, fontWeight: '300', paddingBottom: 8 },
  rateValue: { fontSize: 64, fontWeight: '200', color: Colors.gold, letterSpacing: -2 },
  rateUnit: { fontSize: 18, color: Colors.textSecondary, paddingBottom: 12 },
  rateDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
