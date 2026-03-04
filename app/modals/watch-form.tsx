import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WatchForm } from '../../src/components/watch/WatchForm';
import { WatchFormData, MovementType, WatchStatus, Currency } from '../../src/types';
import { useWatches } from '../../src/hooks/useWatches';
import { Colors } from '../../src/constants';
import { useDatabase } from '../../src/hooks/useDatabase';

export default function WatchFormModal() {
  const router = useRouter();
  const { watchId } = useLocalSearchParams<{ watchId?: string }>();
  const { isReady } = useDatabase();
  const { createWatch, editWatch, loading } = useWatches();

  const isEdit = Boolean(watchId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: WatchFormData, photoUris: string[]) => {
    setIsSubmitting(true);
    try {
      const watchData = {
        brand: formData.brand.trim(),
        modelName: formData.modelName.trim(),
        referenceNumber: formData.referenceNumber.trim() || undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        caliber: formData.caliber.trim() || undefined,
        movementType: formData.movementType as MovementType,
        caseDiameterMm: formData.caseDiameterMm ? parseFloat(formData.caseDiameterMm) : undefined,
        caseThicknessMm: formData.caseThicknessMm ? parseFloat(formData.caseThicknessMm) : undefined,
        lugToLugMm: formData.lugToLugMm ? parseFloat(formData.lugToLugMm) : undefined,
        lugWidthMm: formData.lugWidthMm ? parseFloat(formData.lugWidthMm) : undefined,
        caseMaterial: formData.caseMaterial.trim() || undefined,
        crystalType: formData.crystalType || undefined,
        waterResistanceM: formData.waterResistanceM ? parseInt(formData.waterResistanceM) : undefined,
        dialColor: formData.dialColor.trim() || undefined,
        complications: formData.complications
          ? formData.complications.split(',').map((c) => c.trim()).filter(Boolean)
          : undefined,
        powerReserveHours: formData.powerReserveHours ? parseInt(formData.powerReserveHours) : undefined,
        frequencyBph: formData.frequencyBph ? parseInt(formData.frequencyBph) : undefined,
        nickname: formData.nickname.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        purchaseCurrency: (formData.purchaseCurrency as Currency) || undefined,
        purchaseChannel: formData.purchaseChannel.trim() || undefined,
        purchaseCondition: formData.purchaseCondition || undefined,
        warrantyExpiryDate: formData.warrantyExpiryDate || undefined,
        status: formData.status as WatchStatus,
        isActive: true,
      };

      if (isEdit && watchId) {
        const success = await editWatch(parseInt(watchId), watchData);
        if (success) {
          Alert.alert('완료', '시계 정보가 수정되었습니다.', [
            { text: '확인', onPress: () => router.back() },
          ]);
        } else {
          Alert.alert('오류', '수정에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        const id = await createWatch(watchData, photoUris);
        if (id) {
          Alert.alert('완료', '시계가 등록되었습니다!', [
            { text: '확인', onPress: () => router.back() },
          ]);
        } else {
          Alert.alert('오류', '등록에 실패했습니다. 다시 시도해주세요.');
        }
      }
    } catch (_err) {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) return null;

  return (
    <>
      <Stack.Screen options={{ title: isEdit ? '시계 편집' : '시계 등록' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <WatchForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isSubmitting || loading}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
