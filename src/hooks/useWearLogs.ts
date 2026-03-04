import { useState, useCallback } from 'react';
import { WearLog } from '../types';
import {
  getWearLogsByWatchId,
  getWearLogsByDate,
  getWearLogsByMonth,
  getTodayWearLogs,
  getWearStats,
  insertWearLog,
  updateWearLog,
  deleteWearLog,
  getDatesWithWearLogs,
  getLastWearDateByWatchId,
} from '../database/queries/wear-log.queries';
import { useDb } from './useDatabase';
import { getTodayString } from '../utils/date';

export function useWearLogs() {
  const db = useDb();
  const [loading, setLoading] = useState(false);

  const fetchTodayLogs = useCallback(async () => {
    try {
      return await getTodayWearLogs(db);
    } catch {
      return [];
    }
  }, [db]);

  const fetchByDate = useCallback(async (date: string) => {
    try {
      return await getWearLogsByDate(db, date);
    } catch {
      return [];
    }
  }, [db]);

  const fetchByWatchId = useCallback(
    async (watchId: number, limit?: number): Promise<WearLog[]> => {
      try {
        return await getWearLogsByWatchId(db, watchId, limit);
      } catch {
        return [];
      }
    },
    [db]
  );

  const fetchByMonth = useCallback(
    async (year: number, month: number): Promise<WearLog[]> => {
      try {
        return await getWearLogsByMonth(db, year, month);
      } catch {
        return [];
      }
    },
    [db]
  );

  const fetchDatesWithLogs = useCallback(
    async (year: number, month: number): Promise<string[]> => {
      try {
        return await getDatesWithWearLogs(db, year, month);
      } catch {
        return [];
      }
    },
    [db]
  );

  const fetchStats = useCallback(
    async (startDate: string, endDate: string) => {
      try {
        return await getWearStats(db, startDate, endDate);
      } catch {
        return [];
      }
    },
    [db]
  );

  const fetchLastWearDate = useCallback(
    async (watchId: number): Promise<string | null> => {
      try {
        return await getLastWearDateByWatchId(db, watchId);
      } catch {
        return null;
      }
    },
    [db]
  );

  const createLog = useCallback(
    async (log: Omit<WearLog, 'id'>): Promise<number | null> => {
      setLoading(true);
      try {
        return await insertWearLog(db, log);
      } catch {
        return null;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const editLog = useCallback(
    async (id: number, data: Partial<WearLog>): Promise<boolean> => {
      setLoading(true);
      try {
        await updateWearLog(db, id, data);
        return true;
      } catch {
        return false;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const removeLog = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        await deleteWearLog(db, id);
        return true;
      } catch {
        return false;
      }
    },
    [db]
  );

  return {
    loading,
    fetchTodayLogs,
    fetchByDate,
    fetchByWatchId,
    fetchByMonth,
    fetchDatesWithLogs,
    fetchStats,
    fetchLastWearDate,
    createLog,
    editLog,
    removeLog,
  };
}
