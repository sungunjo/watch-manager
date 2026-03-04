import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

import { useServiceRecords } from '../../src/hooks/useServiceRecords';
import { useWatches } from '../../src/hooks/useWatches';
import { ServiceType, Currency } from '../../src/types';
import {
  Colors,
  SERVICE_TYPE_LABELS,
} from '../../src/constants';
import { TextField, SelectField, OptionSheet } from '../../src/components/common/FormField';
import { Button } from '../../src/components/common/Button';
import { getTodayString } from '../../src/utils/date';

const SERVICE_TYPE_OPTIONS = Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => ({
  value: value as ServiceType,
  label,
}));

const CURRENCY_OPTIONS = Object.values(Currency).map((c) => ({ value: c, label: c }));

export default function ServiceFormModal() {
  const router = useRouter();
  const { watchId, recordId } = useLocalSearchParams<{ watchId?: string; recordId?: string }>();
  const { fetchWatchById } = useWatches();
  const { createRecord, loading } = useServiceRecords();

  const [watchName, setWatchName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.OVERHAUL);
  const [serviceDate, setServiceDate] = useState(getTodayString());
  const [serviceProvider, setServiceProvider] = useState('');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.KRW);
  const [description, setDescription] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [beforeDailyRate, setBeforeDailyRate] = useState('');
  const [afterDailyRate, setAfterDailyRate] = useState('');

  const [sheetVisible, setSheetVisible] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (watchId) {
      fetchWatchById(parseInt(watchId)).then((w) => {
        if (w) setWatchName(`${w.brand} ${w.nickname || w.modelName}`);
      });
    }
  }, [watchId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!watchId) newErrors.watch = '시계를 선택해주세요';
    if (!serviceDate) newErrors.serviceDate = '서비스 일자를 입력하세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const id = await createRecord({
        watchId: parseInt(watchId!),
        serviceType,
        serviceDate,
        serviceProvider: serviceProvider.trim() || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        currency: cost ? currency : undefined,
        description: description.trim() || undefined,
        completedDate: completedDate || undefined,
        beforeDailyRate: beforeDailyRate ? parseFloat(beforeDailyRate) : undefined,
        afterDailyRate: afterDailyRate ? parseFloat(afterDailyRate) : undefined,
      });

      if (id) {
        Alert.alert('완료', '서비스 이력이 등록되었습니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('오류', '등록에 실패했습니다.');
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
          title: '서비스 이력 등록',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.text,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {watchName && (
            <View style={styles.watchBanner}>
              <Text style={styles.watchBannerText}>{watchName}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>서비스 정보</Text>

            <SelectField
              label="서비스 종류"
              required
              value={serviceType}
              displayValue={SERVICE_TYPE_LABELS[serviceType]}
              onPress={() => setSheetVisible('serviceType')}
            />

            <TextField
              label="서비스 일자"
              required
              value={serviceDate}
              onChangeText={setServiceDate}
              placeholder="YYYY-MM-DD"
              error={errors.serviceDate}
            />

            <TextField
              label="서비스 업체"
              value={serviceProvider}
              onChangeText={setServiceProvider}
              placeholder="Rolex Korea, 현대 시계방..."
            />

            <TextField
              label="완료 일자"
              value={completedDate}
              onChangeText={setCompletedDate}
              placeholder="YYYY-MM-DD (완료시 입력)"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>비용</Text>
            <View style={styles.row}>
              <View style={{ flex: 2, marginRight: 8 }}>
                <TextField
                  label="비용"
                  value={cost}
                  onChangeText={setCost}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <SelectField
                  label="통화"
                  value={currency}
                  onPress={() => setSheetVisible('currency')}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>정밀도 연계</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <TextField
                  label="서비스 전 일차"
                  value={beforeDailyRate}
                  onChangeText={setBeforeDailyRate}
                  placeholder="+3.2"
                  keyboardType="numbers-and-punctuation"
                  unit="s/d"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label="서비스 후 일차"
                  value={afterDailyRate}
                  onChangeText={setAfterDailyRate}
                  placeholder="+0.5"
                  keyboardType="numbers-and-punctuation"
                  unit="s/d"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <TextField
              label="상세 내용"
              value={description}
              onChangeText={setDescription}
              placeholder="서비스 내용, 교체 부품 등..."
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top' }}
            />
          </View>

          <View style={styles.buttons}>
            <Button title="취소" onPress={() => router.back()} variant="outline" style={{ flex: 1, marginRight: 8 }} />
            <Button title="등록하기" onPress={handleSubmit} loading={isSubmitting || loading} style={{ flex: 2 }} />
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>

        <OptionSheet
          visible={sheetVisible === 'serviceType'}
          title="서비스 종류"
          options={SERVICE_TYPE_OPTIONS}
          selectedValue={serviceType}
          onSelect={(v) => setServiceType(v)}
          onClose={() => setSheetVisible(null)}
        />
        <OptionSheet
          visible={sheetVisible === 'currency'}
          title="통화"
          options={CURRENCY_OPTIONS}
          selectedValue={currency}
          onSelect={(v) => setCurrency(v)}
          onClose={() => setSheetVisible(null)}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  watchBanner: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  watchBannerText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  row: { flexDirection: 'row' },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
