import { useState, useCallback } from 'react';
import { ServiceRecord, ServiceType } from '../types';
import {
  getServiceRecordsByWatchId,
  getLastOverhaul,
  insertServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
} from '../database/queries/service.queries';
import { useDb } from './useDatabase';
import { DEFAULT_OVERHAUL_INTERVAL_MONTHS } from '../constants';
import { calculateNextOverhaulDate, calculateDDay } from '../utils/calculation';

export function useServiceRecords() {
  const db = useDb();
  const [loading, setLoading] = useState(false);

  const fetchByWatchId = useCallback(
    async (watchId: number): Promise<ServiceRecord[]> => {
      try {
        return await getServiceRecordsByWatchId(db, watchId);
      } catch {
        return [];
      }
    },
    [db]
  );

  const createRecord = useCallback(
    async (record: Omit<ServiceRecord, 'id'>): Promise<number | null> => {
      setLoading(true);
      try {
        return await insertServiceRecord(db, record);
      } catch {
        return null;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const editRecord = useCallback(
    async (id: number, record: Partial<ServiceRecord>): Promise<boolean> => {
      setLoading(true);
      try {
        await updateServiceRecord(db, id, record);
        return true;
      } catch {
        return false;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const removeRecord = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        await deleteServiceRecord(db, id);
        return true;
      } catch {
        return false;
      }
    },
    [db]
  );

  const getNextOverhaulInfo = useCallback(
    async (
      watchId: number,
      purchaseDate?: string,
      intervalMonths: number = DEFAULT_OVERHAUL_INTERVAL_MONTHS
    ): Promise<{
      lastOverhaulDate: string | null;
      nextOverhaulDate: Date;
      daysUntil: number;
      isOverdue: boolean;
    }> => {
      const lastOverhaul = await getLastOverhaul(db, watchId);
      const baseDate = lastOverhaul?.serviceDate || purchaseDate;

      if (!baseDate) {
        const future = new Date();
        future.setMonth(future.getMonth() + intervalMonths);
        return {
          lastOverhaulDate: null,
          nextOverhaulDate: future,
          daysUntil: intervalMonths * 30,
          isOverdue: false,
        };
      }

      const nextDate = calculateNextOverhaulDate(new Date(baseDate), intervalMonths);
      const daysUntil = calculateDDay(nextDate.toISOString().split('T')[0]);

      return {
        lastOverhaulDate: baseDate,
        nextOverhaulDate: nextDate,
        daysUntil,
        isOverdue: daysUntil < 0,
      };
    },
    [db]
  );

  return {
    loading,
    fetchByWatchId,
    createRecord,
    editRecord,
    removeRecord,
    getNextOverhaulInfo,
  };
}
