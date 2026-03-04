import { SQLiteDatabase } from 'expo-sqlite';
import { Measurement, MeasurementPosition } from '../../types';

function rowToMeasurement(row: Record<string, unknown>): Measurement {
  return {
    id: row.id as number,
    watchId: row.watch_id as number,
    measurementDate: row.measurement_date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string | undefined,
    referenceStart: row.reference_start as string,
    referenceEnd: row.reference_end as string | undefined,
    watchStart: row.watch_start as string,
    watchEnd: row.watch_end as string | undefined,
    dailyRateSec: row.daily_rate_sec as number | undefined,
    position: row.position as MeasurementPosition | undefined,
    notes: row.notes as string | undefined,
  };
}

export async function getMeasurementsByWatchId(
  db: SQLiteDatabase,
  watchId: number,
  limit?: number
): Promise<Measurement[]> {
  const query = limit
    ? 'SELECT * FROM measurements WHERE watch_id = ? ORDER BY measurement_date DESC LIMIT ?'
    : 'SELECT * FROM measurements WHERE watch_id = ? ORDER BY measurement_date DESC';
  const params = limit ? [watchId, limit] : [watchId];
  const rows = await db.getAllAsync<Record<string, unknown>>(query, params);
  return rows.map(rowToMeasurement);
}

export async function getMeasurementById(
  db: SQLiteDatabase,
  id: number
): Promise<Measurement | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM measurements WHERE id = ?',
    [id]
  );
  if (!row) return null;
  return rowToMeasurement(row);
}

export async function getInProgressMeasurement(
  db: SQLiteDatabase,
  watchId: number
): Promise<Measurement | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM measurements WHERE watch_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1',
    [watchId]
  );
  if (!row) return null;
  return rowToMeasurement(row);
}

export async function insertMeasurement(
  db: SQLiteDatabase,
  measurement: Omit<Measurement, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO measurements (
      watch_id, measurement_date, start_time, end_time,
      reference_start, reference_end, watch_start, watch_end,
      daily_rate_sec, position, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      measurement.watchId,
      measurement.measurementDate,
      measurement.startTime,
      measurement.endTime ?? null,
      measurement.referenceStart,
      measurement.referenceEnd ?? null,
      measurement.watchStart,
      measurement.watchEnd ?? null,
      measurement.dailyRateSec ?? null,
      measurement.position ?? null,
      measurement.notes ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateMeasurement(
  db: SQLiteDatabase,
  id: number,
  data: Partial<Measurement>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.endTime !== undefined) {
    fields.push('end_time = ?');
    values.push(data.endTime ?? null);
  }
  if (data.referenceEnd !== undefined) {
    fields.push('reference_end = ?');
    values.push(data.referenceEnd ?? null);
  }
  if (data.watchEnd !== undefined) {
    fields.push('watch_end = ?');
    values.push(data.watchEnd ?? null);
  }
  if (data.dailyRateSec !== undefined) {
    fields.push('daily_rate_sec = ?');
    values.push(data.dailyRateSec ?? null);
  }
  if (data.position !== undefined) {
    fields.push('position = ?');
    values.push(data.position ?? null);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes ?? null);
  }

  if (fields.length === 0) return;
  values.push(id);

  await db.runAsync(
    `UPDATE measurements SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteMeasurement(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM measurements WHERE id = ?', [id]);
}

export async function getAverageDailyRate(
  db: SQLiteDatabase,
  watchId: number,
  lastN: number = 5
): Promise<number | null> {
  const result = await db.getFirstAsync<{ avg_rate: number | null }>(
    `SELECT AVG(daily_rate_sec) as avg_rate
     FROM (
       SELECT daily_rate_sec
       FROM measurements
       WHERE watch_id = ? AND daily_rate_sec IS NOT NULL
       ORDER BY measurement_date DESC
       LIMIT ?
     )`,
    [watchId, lastN]
  );
  return result?.avg_rate ?? null;
}
