import { useState, useCallback } from 'react';
import { Measurement, MeasurementPosition } from '../types';
import {
  getMeasurementsByWatchId,
  getMeasurementById,
  getInProgressMeasurement,
  insertMeasurement,
  updateMeasurement,
  deleteMeasurement,
  getAverageDailyRate,
} from '../database/queries/measurement.queries';
import { useDb } from './useDatabase';
import { calculateDailyRate } from '../utils/calculation';

export function useMeasurements() {
  const db = useDb();
  const [loading, setLoading] = useState(false);

  const fetchByWatchId = useCallback(
    async (watchId: number, limit?: number): Promise<Measurement[]> => {
      try {
        return await getMeasurementsByWatchId(db, watchId, limit);
      } catch {
        return [];
      }
    },
    [db]
  );

  const fetchInProgress = useCallback(
    async (watchId: number): Promise<Measurement | null> => {
      try {
        return await getInProgressMeasurement(db, watchId);
      } catch {
        return null;
      }
    },
    [db]
  );

  const startMeasurement = useCallback(
    async (
      watchId: number,
      watchStartTime: string,
      referenceStartTime: string,
      position: MeasurementPosition = MeasurementPosition.DIAL_UP
    ): Promise<number | null> => {
      setLoading(true);
      try {
        const now = new Date().toISOString();
        const id = await insertMeasurement(db, {
          watchId,
          measurementDate: now,
          startTime: now,
          referenceStart: referenceStartTime,
          watchStart: watchStartTime,
          position,
        });
        return id;
      } catch {
        return null;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const completeMeasurement = useCallback(
    async (
      measurementId: number,
      watchEndTime: string,
      referenceEndTime: string,
      notes?: string
    ): Promise<{ dailyRate: number } | null> => {
      setLoading(true);
      try {
        const measurement = await getMeasurementById(db, measurementId);
        if (!measurement) return null;

        const referenceStart = new Date(measurement.referenceStart);
        const referenceEnd = new Date(referenceEndTime);
        const watchStart = new Date(measurement.watchStart);
        const watchEnd = new Date(watchEndTime);

        const dailyRate = calculateDailyRate(referenceStart, referenceEnd, watchStart, watchEnd);
        const now = new Date().toISOString();

        await updateMeasurement(db, measurementId, {
          endTime: now,
          referenceEnd: referenceEndTime,
          watchEnd: watchEndTime,
          dailyRateSec: dailyRate,
          notes,
        });

        return { dailyRate };
      } catch {
        return null;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const removeMeasurement = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        await deleteMeasurement(db, id);
        return true;
      } catch {
        return false;
      }
    },
    [db]
  );

  const fetchAverageRate = useCallback(
    async (watchId: number, lastN: number = 5): Promise<number | null> => {
      try {
        return await getAverageDailyRate(db, watchId, lastN);
      } catch {
        return null;
      }
    },
    [db]
  );

  return {
    loading,
    fetchByWatchId,
    fetchInProgress,
    startMeasurement,
    completeMeasurement,
    removeMeasurement,
    fetchAverageRate,
  };
}
