import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WatchListItem, WatchStatus, MovementType } from '../../types';
import { Colors, MOVEMENT_TYPE_LABELS, WATCH_STATUS_LABELS } from '../../constants';
import { formatRelativeDate } from '../../utils/calculation';

// ===== Grid Card (사진 중심) =====
interface WatchGridCardProps {
  watch: WatchListItem;
  onPress: () => void;
}

export function WatchGridCard({ watch, onPress }: WatchGridCardProps) {
  const statusColor = {
    [WatchStatus.WEARING]: Colors.success,
    [WatchStatus.STORED]: Colors.textMuted,
    [WatchStatus.IN_SERVICE]: Colors.warning,
    [WatchStatus.SOLD]: Colors.error,
  }[watch.status];

  return (
    <TouchableOpacity style={gridStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={gridStyles.imageContainer}>
        {watch.coverPhotoUri ? (
          <Image source={{ uri: watch.coverPhotoUri }} style={gridStyles.image} resizeMode="cover" />
        ) : (
          <View style={gridStyles.imagePlaceholder}>
            <Ionicons name="watch-outline" size={36} color={Colors.textMuted} />
          </View>
        )}
        <View style={[gridStyles.statusDot, { backgroundColor: statusColor }]} />
      </View>
      <View style={gridStyles.info}>
        <Text style={gridStyles.brand} numberOfLines={1}>{watch.brand}</Text>
        <Text style={gridStyles.model} numberOfLines={1}>
          {watch.nickname || watch.modelName}
        </Text>
        {watch.referenceNumber && (
          <Text style={gridStyles.ref} numberOfLines={1}>Ref. {watch.referenceNumber}</Text>
        )}
        <View style={gridStyles.footer}>
          <Text style={gridStyles.movement}>
            {MOVEMENT_TYPE_LABELS[watch.movementType]?.substring(0, 4) ?? ''}
          </Text>
          {watch.lastWornDate && (
            <Text style={gridStyles.lastWorn}>
              {formatRelativeDate(watch.lastWornDate)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const gridStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    flex: 1,
    margin: 4,
  },
  imageContainer: {
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceLight,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  info: {
    padding: 10,
  },
  brand: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  model: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  ref: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  movement: {
    fontSize: 10,
    color: Colors.gold,
    fontWeight: '600',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lastWorn: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});

// ===== List Row Card =====
interface WatchListRowProps {
  watch: WatchListItem;
  onPress: () => void;
}

export function WatchListRow({ watch, onPress }: WatchListRowProps) {
  const statusColor = {
    [WatchStatus.WEARING]: Colors.success,
    [WatchStatus.STORED]: Colors.textMuted,
    [WatchStatus.IN_SERVICE]: Colors.warning,
    [WatchStatus.SOLD]: Colors.error,
  }[watch.status];

  return (
    <TouchableOpacity style={listStyles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={listStyles.imageWrap}>
        {watch.coverPhotoUri ? (
          <Image source={{ uri: watch.coverPhotoUri }} style={listStyles.image} resizeMode="cover" />
        ) : (
          <View style={listStyles.imagePlaceholder}>
            <Ionicons name="watch-outline" size={24} color={Colors.textMuted} />
          </View>
        )}
      </View>
      <View style={listStyles.info}>
        <View style={listStyles.titleRow}>
          <Text style={listStyles.brand}>{watch.brand}</Text>
          <View style={[listStyles.statusBadge, { borderColor: statusColor }]}>
            <Text style={[listStyles.statusText, { color: statusColor }]}>
              {WATCH_STATUS_LABELS[watch.status]}
            </Text>
          </View>
        </View>
        <Text style={listStyles.model} numberOfLines={1}>
          {watch.nickname ? `${watch.nickname} (${watch.modelName})` : watch.modelName}
        </Text>
        {watch.referenceNumber && (
          <Text style={listStyles.ref}>Ref. {watch.referenceNumber}</Text>
        )}
        <View style={listStyles.footer}>
          <Text style={listStyles.movement}>{MOVEMENT_TYPE_LABELS[watch.movementType]}</Text>
          {watch.lastWornDate && (
            <Text style={listStyles.lastWorn}>
              최근 착용: {formatRelativeDate(watch.lastWornDate)}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const listStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
  },
  imageWrap: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceLight,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  model: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  ref: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  movement: {
    fontSize: 11,
    color: Colors.gold,
    fontWeight: '500',
  },
  lastWorn: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
