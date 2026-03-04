import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { WatchGridCard, WatchListRow } from '../../../src/components/watch/WatchCard';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { OptionSheet } from '../../../src/components/common/FormField';
import { useWatches } from '../../../src/hooks/useWatches';
import { WatchListItem, MovementType, WatchStatus } from '../../../src/types';
import {
  Colors,
  MOVEMENT_TYPE_LABELS,
  WATCH_STATUS_LABELS,
} from '../../../src/constants';
import { useDatabase } from '../../../src/hooks/useDatabase';

type ViewMode = 'grid' | 'list';
type SortKey = 'created_at' | 'brand' | 'model_name' | 'purchase_date';

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: '등록일', value: 'created_at' },
  { label: '브랜드', value: 'brand' },
  { label: '모델명', value: 'model_name' },
  { label: '구매일', value: 'purchase_date' },
];

const MOVEMENT_FILTER_OPTIONS = [
  { label: '전체', value: '' },
  ...Object.entries(MOVEMENT_TYPE_LABELS).map(([v, l]) => ({ label: l, value: v })),
];

const STATUS_FILTER_OPTIONS = [
  { label: '전체', value: '' },
  ...Object.entries(WATCH_STATUS_LABELS).map(([v, l]) => ({ label: l, value: v })),
];

export default function CollectionScreen() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const { fetchWatches, removeWatch } = useWatches();

  const [watches, setWatches] = useState<WatchListItem[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [filterMovement, setFilterMovement] = useState<MovementType | ''>('');
  const [filterStatus, setFilterStatus] = useState<WatchStatus | ''>('');
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isReady) return;
    const items = await fetchWatches({
      search: search || undefined,
      movementType: filterMovement || undefined,
      status: filterStatus || undefined,
      sortBy,
      sortOrder: 'DESC',
    });
    setWatches(items);
  }, [isReady, fetchWatches, search, filterMovement, filterStatus, sortBy]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = (item: WatchListItem) => {
    Alert.alert(
      '시계 삭제',
      `${item.brand} ${item.modelName}을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await removeWatch(item.id);
            await load();
          },
        },
      ]
    );
  };

  const hasFilters = filterMovement !== '' || filterStatus !== '';

  const renderGridItem = ({ item, index }: { item: WatchListItem; index: number }) => {
    if (index % 2 !== 0) return null;
    const nextItem = watches[index + 1];
    return (
      <View style={gridStyles.row}>
        <WatchGridCard
          watch={item}
          onPress={() => router.push(`/collection/${item.id}`)}
        />
        {nextItem ? (
          <WatchGridCard
            watch={nextItem}
            onPress={() => router.push(`/collection/${nextItem.id}`)}
          />
        ) : (
          <View style={gridStyles.emptyCell} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>컬렉션</Text>
          <Text style={styles.headerSubtitle}>{watches.length}개의 시계</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list' : 'grid'}
              size={20}
              color={Colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/modals/watch-form')}
          >
            <Ionicons name="add" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="브랜드, 모델명, 레퍼런스 검색"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={load}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterMovement && styles.filterChipActive]}
          onPress={() => setSheetVisible('filter_movement')}
        >
          <Ionicons name="options" size={12} color={filterMovement ? Colors.gold : Colors.textMuted} />
          <Text style={[styles.filterChipText, filterMovement && styles.filterChipTextActive]}>
            {filterMovement ? MOVEMENT_TYPE_LABELS[filterMovement as MovementType] : '무브먼트'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus && styles.filterChipActive]}
          onPress={() => setSheetVisible('filter_status')}
        >
          <Text style={[styles.filterChipText, filterStatus && styles.filterChipTextActive]}>
            {filterStatus ? WATCH_STATUS_LABELS[filterStatus as WatchStatus] : '상태'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setSheetVisible('sort')}
        >
          <Ionicons name="swap-vertical" size={12} color={Colors.textMuted} />
          <Text style={styles.filterChipText}>
            {SORT_OPTIONS.find((s) => s.value === sortBy)?.label ?? '정렬'}
          </Text>
        </TouchableOpacity>

        {hasFilters && (
          <TouchableOpacity
            style={styles.clearFilter}
            onPress={() => { setFilterMovement(''); setFilterStatus(''); }}
          >
            <Text style={styles.clearFilterText}>초기화</Text>
          </TouchableOpacity>
        )}
      </View>

      {isReady && (
        <FlatList
          data={viewMode === 'list' ? watches : watches}
          keyExtractor={(item) => String(item.id)}
          renderItem={
            viewMode === 'list'
              ? ({ item }) => (
                  <WatchListRow
                    watch={item}
                    onPress={() => router.push(`/collection/${item.id}`)}
                  />
                )
              : renderGridItem
          }
          contentContainerStyle={[
            styles.listContent,
            watches.length === 0 && { flex: 1 },
          ]}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.gold}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="watch-outline"
              title={search ? '검색 결과 없음' : '시계가 없습니다'}
              description={
                search ? '다른 검색어를 시도해보세요' : '첫 번째 시계를 등록해보세요!'
              }
              actionLabel={search ? undefined : '시계 등록하기'}
              onAction={search ? undefined : () => router.push('/modals/watch-form')}
            />
          }
        />
      )}

      <OptionSheet
        visible={sheetVisible === 'filter_movement'}
        title="무브먼트 필터"
        options={MOVEMENT_FILTER_OPTIONS}
        selectedValue={filterMovement}
        onSelect={(v) => setFilterMovement(v as MovementType | '')}
        onClose={() => setSheetVisible(null)}
      />
      <OptionSheet
        visible={sheetVisible === 'filter_status'}
        title="상태 필터"
        options={STATUS_FILTER_OPTIONS}
        selectedValue={filterStatus}
        onSelect={(v) => setFilterStatus(v as WatchStatus | '')}
        onClose={() => setSheetVisible(null)}
      />
      <OptionSheet
        visible={sheetVisible === 'sort'}
        title="정렬"
        options={SORT_OPTIONS}
        selectedValue={sortBy}
        onSelect={(v) => setSortBy(v as SortKey)}
        onClose={() => setSheetVisible(null)}
      />
    </SafeAreaView>
  );
}

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
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconButton: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  addButton: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, height: 40,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8,
    gap: 8, alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { borderColor: Colors.gold, backgroundColor: Colors.surfaceLight },
  filterChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  filterChipTextActive: { color: Colors.gold },
  clearFilter: { paddingHorizontal: 8, paddingVertical: 6 },
  clearFilterText: { fontSize: 12, color: Colors.accent, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { padding: 12 },
});

const gridStyles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 4 },
  emptyCell: { flex: 1, margin: 4 },
});
