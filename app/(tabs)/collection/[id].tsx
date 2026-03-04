import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useWatches } from '../../../src/hooks/useWatches';
import { useMeasurements } from '../../../src/hooks/useMeasurements';
import { useServiceRecords } from '../../../src/hooks/useServiceRecords';
import { Watch, WatchPhoto, WatchStatus, Measurement, ServiceRecord } from '../../../src/types';
import {
  Colors,
  MOVEMENT_TYPE_LABELS,
  WATCH_STATUS_LABELS,
  CRYSTAL_TYPE_LABELS,
  PURCHASE_CONDITION_LABELS,
  SERVICE_TYPE_LABELS,
} from '../../../src/constants';
import { formatKoreanDate } from '../../../src/utils/date';
import { formatCurrency, formatDailyRate } from '../../../src/utils/calculation';
import { DailyRateChart } from '../../../src/components/measurement/DailyRateChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function PlaceholderTab({ icon, title, description, actionLabel, onAction }: {
  icon: string; title: string; description: string; actionLabel: string; onAction: () => void;
}) {
  return (
    <View style={{ padding: 24, alignItems: 'center' }}>
      <Ionicons name={icon as any} size={48} color={Colors.textSecondary} />
      <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 12 }}>{title}</Text>
      <Text style={{ color: Colors.textSecondary, marginTop: 8, textAlign: 'center' }}>{description}</Text>
      <TouchableOpacity onPress={onAction} style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function WatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { fetchWatchById, fetchPhotos, removeWatch } = useWatches();

  const { fetchByWatchId: fetchMeasurements } = useMeasurements();
  const { fetchByWatchId: fetchServices } = useServiceRecords();

  const [watch, setWatch] = useState<Watch | null>(null);
  const [photos, setPhotos] = useState<WatchPhoto[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'spec' | 'accuracy' | 'service' | 'wear'>('spec');
  const [photoIndex, setPhotoIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (!id) return;
        const watchData = await fetchWatchById(parseInt(id));
        if (watchData) {
          setWatch(watchData);
          const [photoData, measureData, serviceData] = await Promise.all([
            fetchPhotos(watchData.id),
            fetchMeasurements(watchData.id),
            fetchServices(watchData.id),
          ]);
          setPhotos(photoData.filter((p) => p.photoType === 'WATCH'));
          setMeasurements(measureData);
          setServiceRecords(serviceData);
        }
      };
      load();
    }, [id, fetchWatchById, fetchPhotos, fetchMeasurements, fetchServices])
  );

  const handleDelete = () => {
    if (!watch) return;
    Alert.alert(
      '시계 삭제',
      `${watch.brand} ${watch.modelName}을(를) 삭제하시겠습니까?\n모든 관련 데이터(측정, 서비스, 착용 기록)가 함께 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            if (await removeWatch(watch.id)) {
              router.back();
            }
          },
        },
      ]
    );
  };

  if (!watch) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = {
    [WatchStatus.WEARING]: Colors.success,
    [WatchStatus.STORED]: Colors.textMuted,
    [WatchStatus.IN_SERVICE]: Colors.warning,
    [WatchStatus.SOLD]: Colors.error,
  }[watch.status];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: watch.nickname || `${watch.brand} ${watch.modelName}`,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.text,
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/modals/watch-form', params: { watchId: watch.id } })
                }
                style={styles.headerBtn}
              >
                <Ionicons name="create-outline" size={22} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
                <Ionicons name="trash-outline" size={22} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 사진 캐러셀 */}
        <View style={styles.photoCarousel}>
          {photos.length > 0 ? (
            <>
              <FlatList
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                data={photos}
                keyExtractor={(p) => String(p.id)}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item.photoUri }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                )}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setPhotoIndex(index);
                }}
              />
              {photos.length > 1 && (
                <View style={styles.photoDots}>
                  {photos.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === photoIndex && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noPhoto}>
              <Ionicons name="watch-outline" size={64} color={Colors.textMuted} />
            </View>
          )}
        </View>

        {/* 기본 정보 헤더 */}
        <View style={styles.watchHeader}>
          <Text style={styles.watchBrand}>{watch.brand}</Text>
          <Text style={styles.watchModel}>
            {watch.nickname ? `${watch.nickname}` : watch.modelName}
          </Text>
          {watch.nickname && (
            <Text style={styles.watchModelSub}>{watch.modelName}</Text>
          )}
          {watch.referenceNumber && (
            <Text style={styles.watchRef}>Ref. {watch.referenceNumber}</Text>
          )}
          <View style={styles.watchMeta}>
            <View style={[styles.statusBadge, { borderColor: statusColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {WATCH_STATUS_LABELS[watch.status]}
              </Text>
            </View>
            <Text style={styles.movementBadge}>
              {MOVEMENT_TYPE_LABELS[watch.movementType]}
            </Text>
          </View>
        </View>

        {/* 탭 바 */}
        <View style={styles.tabBar}>
          {(['spec', 'accuracy', 'service', 'wear'] as const).map((tab) => {
            const labels = { spec: '스펙', accuracy: '정밀도', service: '유지보수', wear: '착용' };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 탭 컨텐츠 */}
        <View style={styles.tabContent}>
          {activeTab === 'spec' && <SpecTab watch={watch} />}
          {activeTab === 'accuracy' && (
            <AccuracyTab
              watchId={watch.id}
              measurements={measurements}
              serviceRecords={serviceRecords}
              onStartMeasurement={() =>
                router.push(`/modals/measurement?watchId=${watch.id}`)
              }
            />
          )}
          {activeTab === 'service' && (
            <ServiceTab
              watchId={watch.id}
              serviceRecords={serviceRecords}
              onAddService={() =>
                router.push(`/modals/service-form?watchId=${watch.id}`)
              }
            />
          )}
          {activeTab === 'wear' && (
            <PlaceholderTab
              icon="calendar-outline"
              title="착용 기록 탭"
              description="착용 이력은 PR #7에서 구현됩니다"
              actionLabel="오착 기록하기"
              onAction={() => router.push(`/modals/wear-log-form?watchId=${watch.id}`)}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== Spec Tab =====
function SpecTab({ watch }: { watch: Watch }) {
  return (
    <View style={specStyles.container}>
      <SpecSection title="기본 정보">
        <SpecRow label="브랜드" value={watch.brand} />
        <SpecRow label="모델명" value={watch.modelName} />
        {watch.referenceNumber && <SpecRow label="레퍼런스" value={watch.referenceNumber} />}
        {watch.serialNumber && <SpecRow label="시리얼" value={watch.serialNumber} sensitive />}
        {watch.caliber && <SpecRow label="캘리버" value={watch.caliber} />}
        <SpecRow label="무브먼트" value={MOVEMENT_TYPE_LABELS[watch.movementType]} />
        {watch.dialColor && <SpecRow label="다이얼 색상" value={watch.dialColor} />}
        {watch.complications && watch.complications.length > 0 && (
          <SpecRow label="컴플리케이션" value={watch.complications.join(', ')} />
        )}
      </SpecSection>

      <SpecSection title="케이스 스펙">
        {watch.caseDiameterMm && <SpecRow label="케이스 직경" value={`${watch.caseDiameterMm}mm`} />}
        {watch.caseThicknessMm && <SpecRow label="케이스 두께" value={`${watch.caseThicknessMm}mm`} />}
        {watch.lugToLugMm && <SpecRow label="러그 투 러그" value={`${watch.lugToLugMm}mm`} />}
        {watch.lugWidthMm && <SpecRow label="러그 폭" value={`${watch.lugWidthMm}mm`} />}
        {watch.caseMaterial && <SpecRow label="케이스 소재" value={watch.caseMaterial} />}
        {watch.crystalType && (
          <SpecRow label="크리스탈" value={CRYSTAL_TYPE_LABELS[watch.crystalType]} />
        )}
        {watch.waterResistanceM && (
          <SpecRow label="방수 성능" value={`${watch.waterResistanceM}m`} />
        )}
      </SpecSection>

      {(watch.powerReserveHours || watch.frequencyBph) && (
        <SpecSection title="무브먼트 스펙">
          {watch.powerReserveHours && (
            <SpecRow label="파워리저브" value={`${watch.powerReserveHours}시간`} />
          )}
          {watch.frequencyBph && (
            <SpecRow label="진동수" value={`${watch.frequencyBph.toLocaleString()} bph`} />
          )}
        </SpecSection>
      )}

      {(watch.purchaseDate || watch.purchasePrice || watch.warrantyExpiryDate) && (
        <SpecSection title="구매 정보">
          {watch.purchaseDate && (
            <SpecRow label="구매일" value={formatKoreanDate(watch.purchaseDate)} />
          )}
          {watch.purchasePrice && watch.purchaseCurrency && (
            <SpecRow
              label="구매가"
              value={formatCurrency(watch.purchasePrice, watch.purchaseCurrency)}
              sensitive
            />
          )}
          {watch.purchaseChannel && <SpecRow label="구매처" value={watch.purchaseChannel} />}
          {watch.purchaseCondition && (
            <SpecRow
              label="구매 상태"
              value={PURCHASE_CONDITION_LABELS[watch.purchaseCondition]}
            />
          )}
          {watch.warrantyExpiryDate && (
            <SpecRow label="보증 만료일" value={formatKoreanDate(watch.warrantyExpiryDate)} />
          )}
        </SpecSection>
      )}

      {watch.notes && (
        <SpecSection title="메모">
          <Text style={specStyles.notes}>{watch.notes}</Text>
        </SpecSection>
      )}
    </View>
  );
}

function SpecSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={specStyles.section}>
      <Text style={specStyles.sectionTitle}>{title}</Text>
      <View style={specStyles.rows}>{children}</View>
    </View>
  );
}

function SpecRow({
  label,
  value,
  sensitive = false,
}: {
  label: string;
  value: string;
  sensitive?: boolean;
}) {
  const [revealed, setRevealed] = useState(!sensitive);

  return (
    <View style={specStyles.row}>
      <Text style={specStyles.label}>{label}</Text>
      <View style={specStyles.valueRow}>
        <Text style={specStyles.value} numberOfLines={2}>
          {revealed ? value : '••••••'}
        </Text>
        {sensitive && (
          <TouchableOpacity onPress={() => setRevealed((r) => !r)}>
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={16}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const specStyles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  rows: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  valueRow: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  value: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  notes: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

// ===== Accuracy Tab =====
function AccuracyTab({
  watchId,
  measurements,
  serviceRecords,
  onStartMeasurement,
}: {
  watchId: number;
  measurements: Measurement[];
  serviceRecords: ServiceRecord[];
  onStartMeasurement: () => void;
}) {
  const completed = measurements.filter((m) => m.dailyRateSec !== undefined);
  return (
    <View style={{ padding: 16 }}>
      {completed.length === 0 ? (
        <View style={placeholderStyles.container}>
          <Ionicons name="timer-outline" size={48} color={Colors.textMuted} />
          <Text style={placeholderStyles.title}>측정 기록 없음</Text>
          <Text style={placeholderStyles.desc}>Timegrapher로 정밀도를 측정해보세요</Text>
          <TouchableOpacity style={placeholderStyles.btn} onPress={onStartMeasurement}>
            <Text style={placeholderStyles.btnText}>측정 시작하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <DailyRateChart
            measurements={completed}
            serviceRecords={serviceRecords}
            height={200}
          />
          {completed.slice(0, 10).map((m) => {
            const rate = m.dailyRateSec ?? 0;
            const color = Math.abs(rate) <= 4 ? Colors.success : Math.abs(rate) <= 10 ? Colors.warning : Colors.error;
            return (
              <View key={m.id} style={accStyles.row}>
                <Text style={[accStyles.rate, { color }]}>{rate >= 0 ? '+' : ''}{rate.toFixed(2)} s/d</Text>
                <Text style={accStyles.date}>{m.measurementDate.split('T')[0]}</Text>
                {m.notes && <Text style={accStyles.note} numberOfLines={1}>{m.notes}</Text>}
              </View>
            );
          })}
          <TouchableOpacity style={placeholderStyles.btn} onPress={onStartMeasurement}>
            <Text style={placeholderStyles.btnText}>+ 측정 추가</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const accStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rate: { fontSize: 14, fontWeight: '700', minWidth: 80 },
  date: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  note: { fontSize: 11, color: Colors.textMuted, flex: 1 },
});

// ===== Service Tab =====
function ServiceTab({
  watchId,
  serviceRecords,
  onAddService,
}: {
  watchId: number;
  serviceRecords: ServiceRecord[];
  onAddService: () => void;
}) {
  return (
    <View style={{ padding: 16 }}>
      {serviceRecords.length === 0 ? (
        <View style={placeholderStyles.container}>
          <Ionicons name="construct-outline" size={48} color={Colors.textMuted} />
          <Text style={placeholderStyles.title}>서비스 이력 없음</Text>
          <Text style={placeholderStyles.desc}>오버홀, 수리 등 서비스 이력을 기록하세요</Text>
          <TouchableOpacity style={placeholderStyles.btn} onPress={onAddService}>
            <Text style={placeholderStyles.btnText}>서비스 등록</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {serviceRecords.map((s) => (
            <View key={s.id} style={svcStyles.card}>
              <View style={svcStyles.header}>
                <Text style={svcStyles.type}>{SERVICE_TYPE_LABELS[s.serviceType]}</Text>
                <Text style={svcStyles.date}>{s.serviceDate}</Text>
              </View>
              {s.serviceProvider && <Text style={svcStyles.provider}>{s.serviceProvider}</Text>}
              {s.cost && s.currency && (
                <Text style={svcStyles.cost}>
                  {formatCurrency(s.cost, s.currency)}
                </Text>
              )}
              {s.description && <Text style={svcStyles.desc} numberOfLines={2}>{s.description}</Text>}
              {(s.beforeDailyRate !== undefined || s.afterDailyRate !== undefined) && (
                <View style={svcStyles.rateRow}>
                  {s.beforeDailyRate !== undefined && (
                    <Text style={svcStyles.rateLabel}>전: {s.beforeDailyRate >= 0 ? '+' : ''}{s.beforeDailyRate.toFixed(1)}s/d</Text>
                  )}
                  {s.afterDailyRate !== undefined && (
                    <Text style={[svcStyles.rateLabel, { color: Colors.success }]}>후: {s.afterDailyRate >= 0 ? '+' : ''}{s.afterDailyRate.toFixed(1)}s/d</Text>
                  )}
                </View>
              )}
            </View>
          ))}
          <TouchableOpacity style={[placeholderStyles.btn, { marginTop: 8, alignSelf: 'center' }]} onPress={onAddService}>
            <Text style={placeholderStyles.btnText}>+ 서비스 추가</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const svcStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 4,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontSize: 14, fontWeight: '700', color: Colors.text },
  date: { fontSize: 12, color: Colors.textMuted },
  provider: { fontSize: 13, color: Colors.textSecondary },
  cost: { fontSize: 13, color: Colors.gold, fontWeight: '600' },
  desc: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  rateRow: { flexDirection: 'row', gap: 12 },
  rateLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
});

const placeholderStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  desc: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  btn: {
    marginTop: 8,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnText: { color: Colors.text, fontWeight: '600', fontSize: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  scroll: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 6 },
  photoCarousel: {
    height: 280,
    backgroundColor: Colors.surfaceLight,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  noPhoto: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  photoDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: Colors.text,
    width: 18,
  },
  watchHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  watchBrand: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  watchModel: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  watchModelSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  watchRef: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  watchMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  movementBadge: {
    fontSize: 12,
    color: Colors.gold,
    fontWeight: '600',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.gold,
  },
  tabText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.gold,
    fontWeight: '700',
  },
  tabContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
});
