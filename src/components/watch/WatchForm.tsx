import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { TextField, SelectField, FormField, OptionSheet } from '../common/FormField';
import { Button } from '../common/Button';
import { Colors, MOVEMENT_TYPE_LABELS, WATCH_STATUS_LABELS, CRYSTAL_TYPE_LABELS, PURCHASE_CONDITION_LABELS } from '../../constants';
import {
  Watch,
  WatchFormData,
  MovementType,
  WatchStatus,
  CrystalType,
  PurchaseCondition,
  Currency,
} from '../../types';

interface WatchFormProps {
  initialData?: Watch;
  onSubmit: (data: WatchFormData, photoUris: string[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const MOVEMENT_OPTIONS = Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => ({
  value: value as MovementType,
  label,
}));

const STATUS_OPTIONS = Object.entries(WATCH_STATUS_LABELS).map(([value, label]) => ({
  value: value as WatchStatus,
  label,
}));

const CRYSTAL_OPTIONS = [
  { value: '' as CrystalType | '', label: '선택 안 함' },
  ...Object.entries(CRYSTAL_TYPE_LABELS).map(([value, label]) => ({
    value: value as CrystalType,
    label,
  })),
];

const CONDITION_OPTIONS = [
  { value: '' as PurchaseCondition | '', label: '선택 안 함' },
  ...Object.entries(PURCHASE_CONDITION_LABELS).map(([value, label]) => ({
    value: value as PurchaseCondition,
    label,
  })),
];

const CURRENCY_OPTIONS = Object.values(Currency).map((c) => ({ value: c, label: c }));

export function WatchForm({ initialData, onSubmit, onCancel, isLoading }: WatchFormProps) {
  const [form, setForm] = useState<WatchFormData>({
    brand: initialData?.brand ?? '',
    modelName: initialData?.modelName ?? '',
    referenceNumber: initialData?.referenceNumber ?? '',
    serialNumber: initialData?.serialNumber ?? '',
    caliber: initialData?.caliber ?? '',
    movementType: initialData?.movementType ?? MovementType.MECHANICAL_AUTO,
    caseDiameterMm: initialData?.caseDiameterMm?.toString() ?? '',
    caseThicknessMm: initialData?.caseThicknessMm?.toString() ?? '',
    lugToLugMm: initialData?.lugToLugMm?.toString() ?? '',
    lugWidthMm: initialData?.lugWidthMm?.toString() ?? '',
    caseMaterial: initialData?.caseMaterial ?? '',
    crystalType: (initialData?.crystalType ?? '') as CrystalType | '',
    waterResistanceM: initialData?.waterResistanceM?.toString() ?? '',
    dialColor: initialData?.dialColor ?? '',
    complications: initialData?.complications?.join(', ') ?? '',
    powerReserveHours: initialData?.powerReserveHours?.toString() ?? '',
    frequencyBph: initialData?.frequencyBph?.toString() ?? '',
    nickname: initialData?.nickname ?? '',
    notes: initialData?.notes ?? '',
    purchaseDate: initialData?.purchaseDate ?? '',
    purchasePrice: initialData?.purchasePrice?.toString() ?? '',
    purchaseCurrency: initialData?.purchaseCurrency ?? Currency.KRW,
    purchaseChannel: initialData?.purchaseChannel ?? '',
    purchaseCondition: (initialData?.purchaseCondition ?? '') as PurchaseCondition | '',
    warrantyExpiryDate: initialData?.warrantyExpiryDate ?? '',
    status: initialData?.status ?? WatchStatus.STORED,
  });

  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof WatchFormData, string>>>({});
  const [sheetVisible, setSheetVisible] = useState<string | null>(null);

  const setField = <K extends keyof WatchFormData>(key: K, value: WatchFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof WatchFormData, string>> = {};
    if (!form.brand.trim()) newErrors.brand = '브랜드명을 입력하세요';
    if (!form.modelName.trim()) newErrors.modelName = '모델명을 입력하세요';
    if (!form.movementType) newErrors.movementType = '무브먼트 타입을 선택하세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled) {
      setPhotoUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
    });
    if (!result.canceled) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removePhotoAt = (index: number) => {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(form, photoUris);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* 사진 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사진</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
            {photoUris.map((uri, i) => (
              <View key={i} style={styles.photoItem}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => removePhotoAt(i)}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.photoAdd} onPress={handlePickPhoto}>
              <Ionicons name="image-outline" size={24} color={Colors.textMuted} />
              <Text style={styles.photoAddText}>갤러리</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoAdd} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={24} color={Colors.textMuted} />
              <Text style={styles.photoAddText}>촬영</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>

          <TextField
            label="브랜드"
            required
            value={form.brand}
            onChangeText={(v) => setField('brand', v)}
            placeholder="Rolex, Omega, Seiko..."
            error={errors.brand}
          />

          <TextField
            label="모델명"
            required
            value={form.modelName}
            onChangeText={(v) => setField('modelName', v)}
            placeholder="Submariner, Speedmaster..."
            error={errors.modelName}
          />

          <TextField
            label="레퍼런스 넘버"
            value={form.referenceNumber}
            onChangeText={(v) => setField('referenceNumber', v)}
            placeholder="ex. 124060"
          />

          <TextField
            label="시리얼 넘버"
            value={form.serialNumber}
            onChangeText={(v) => setField('serialNumber', v)}
            placeholder="시리얼 넘버"
          />

          <TextField
            label="캘리버 / 무브먼트"
            value={form.caliber}
            onChangeText={(v) => setField('caliber', v)}
            placeholder="ex. Cal.3235, Caliber 9SA5"
          />

          <SelectField
            label="무브먼트 타입"
            required
            value={form.movementType}
            displayValue={MOVEMENT_TYPE_LABELS[form.movementType]}
            onPress={() => setSheetVisible('movementType')}
            error={errors.movementType}
          />

          <TextField
            label="별명 (닉네임)"
            value={form.nickname}
            onChangeText={(v) => setField('nickname', v)}
            placeholder="ex. 블박, 서브마리나"
          />
        </View>

        {/* 스펙 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>케이스 스펙</Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <TextField
                label="케이스 직경"
                value={form.caseDiameterMm}
                onChangeText={(v) => setField('caseDiameterMm', v)}
                placeholder="40.0"
                keyboardType="decimal-pad"
                unit="mm"
              />
            </View>
            <View style={styles.halfField}>
              <TextField
                label="케이스 두께"
                value={form.caseThicknessMm}
                onChangeText={(v) => setField('caseThicknessMm', v)}
                placeholder="12.0"
                keyboardType="decimal-pad"
                unit="mm"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <TextField
                label="러그 투 러그"
                value={form.lugToLugMm}
                onChangeText={(v) => setField('lugToLugMm', v)}
                placeholder="47.0"
                keyboardType="decimal-pad"
                unit="mm"
              />
            </View>
            <View style={styles.halfField}>
              <TextField
                label="러그 폭"
                value={form.lugWidthMm}
                onChangeText={(v) => setField('lugWidthMm', v)}
                placeholder="20"
                keyboardType="decimal-pad"
                unit="mm"
              />
            </View>
          </View>

          <TextField
            label="케이스 소재"
            value={form.caseMaterial}
            onChangeText={(v) => setField('caseMaterial', v)}
            placeholder="Stainless Steel, Titanium, Gold..."
          />

          <SelectField
            label="크리스탈"
            value={form.crystalType}
            displayValue={form.crystalType ? CRYSTAL_TYPE_LABELS[form.crystalType as CrystalType] : '선택 안 함'}
            onPress={() => setSheetVisible('crystalType')}
          />

          <TextField
            label="방수 성능"
            value={form.waterResistanceM}
            onChangeText={(v) => setField('waterResistanceM', v)}
            placeholder="300"
            keyboardType="numeric"
            unit="m"
          />

          <TextField
            label="다이얼 색상"
            value={form.dialColor}
            onChangeText={(v) => setField('dialColor', v)}
            placeholder="Black, Blue, Silver..."
          />
        </View>

        {/* 무브먼트 스펙 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>무브먼트 스펙</Text>

          <TextField
            label="파워리저브"
            value={form.powerReserveHours}
            onChangeText={(v) => setField('powerReserveHours', v)}
            placeholder="70"
            keyboardType="numeric"
            unit="시간"
          />

          <TextField
            label="진동수 (BPH)"
            value={form.frequencyBph}
            onChangeText={(v) => setField('frequencyBph', v)}
            placeholder="28800"
            keyboardType="numeric"
          />

          <TextField
            label="컴플리케이션"
            value={form.complications}
            onChangeText={(v) => setField('complications', v)}
            placeholder="Date, Chronograph, GMT (쉼표로 구분)"
          />
        </View>

        {/* 구매 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>구매 정보</Text>

          <TextField
            label="구매일"
            value={form.purchaseDate}
            onChangeText={(v) => setField('purchaseDate', v)}
            placeholder="YYYY-MM-DD"
          />

          <View style={styles.row}>
            <View style={{ flex: 2, marginRight: 8 }}>
              <TextField
                label="구매가"
                value={form.purchasePrice}
                onChangeText={(v) => setField('purchasePrice', v)}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <SelectField
                label="통화"
                value={form.purchaseCurrency}
                onPress={() => setSheetVisible('currency')}
              />
            </View>
          </View>

          <TextField
            label="구매처"
            value={form.purchaseChannel}
            onChangeText={(v) => setField('purchaseChannel', v)}
            placeholder="AD, 병행, 중고, 경매..."
          />

          <SelectField
            label="구매 상태"
            value={form.purchaseCondition}
            displayValue={
              form.purchaseCondition
                ? PURCHASE_CONDITION_LABELS[form.purchaseCondition as PurchaseCondition]
                : '선택 안 함'
            }
            onPress={() => setSheetVisible('purchaseCondition')}
          />

          <TextField
            label="보증 만료일"
            value={form.warrantyExpiryDate}
            onChangeText={(v) => setField('warrantyExpiryDate', v)}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* 상태 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상태</Text>

          <SelectField
            label="현재 상태"
            value={form.status}
            displayValue={WATCH_STATUS_LABELS[form.status]}
            onPress={() => setSheetVisible('status')}
          />
        </View>

        {/* 메모 */}
        <View style={styles.section}>
          <TextField
            label="메모"
            value={form.notes}
            onChangeText={(v) => setField('notes', v)}
            placeholder="기타 참고 사항을 입력하세요"
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top' }}
          />
        </View>

        <View style={styles.buttons}>
          <Button
            title="취소"
            onPress={onCancel}
            variant="outline"
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title={initialData ? '수정 완료' : '등록하기'}
            onPress={handleSubmit}
            variant="primary"
            loading={isLoading}
            style={{ flex: 2 }}
          />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Option Sheets */}
      <OptionSheet
        visible={sheetVisible === 'movementType'}
        title="무브먼트 타입"
        options={MOVEMENT_OPTIONS}
        selectedValue={form.movementType}
        onSelect={(v) => setField('movementType', v)}
        onClose={() => setSheetVisible(null)}
      />
      <OptionSheet
        visible={sheetVisible === 'crystalType'}
        title="크리스탈 타입"
        options={CRYSTAL_OPTIONS}
        selectedValue={form.crystalType}
        onSelect={(v) => setField('crystalType', v)}
        onClose={() => setSheetVisible(null)}
      />
      <OptionSheet
        visible={sheetVisible === 'purchaseCondition'}
        title="구매 상태"
        options={CONDITION_OPTIONS}
        selectedValue={form.purchaseCondition}
        onSelect={(v) => setField('purchaseCondition', v)}
        onClose={() => setSheetVisible(null)}
      />
      <OptionSheet
        visible={sheetVisible === 'currency'}
        title="통화"
        options={CURRENCY_OPTIONS}
        selectedValue={form.purchaseCurrency}
        onSelect={(v) => setField('purchaseCurrency', v)}
        onClose={() => setSheetVisible(null)}
      />
      <OptionSheet
        visible={sheetVisible === 'status'}
        title="현재 상태"
        options={STATUS_OPTIONS}
        selectedValue={form.status}
        onSelect={(v) => setField('status', v)}
        onClose={() => setSheetVisible(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
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
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfField: {
    flex: 1,
  },
  photoRow: {
    marginBottom: 16,
  },
  photoItem: {
    marginRight: 8,
    position: 'relative',
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    gap: 4,
  },
  photoAddText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
