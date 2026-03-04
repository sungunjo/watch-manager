import { SQLiteDatabase } from 'expo-sqlite';
import { WearLog } from '../../types';

function rowToWearLog(row: Record<string, unknown>): WearLog {
  return {
    id: row.id as number,
    watchId: row.watch_id as number,
    userId: row.user_id as string | undefined,
    wearDate: row.wear_date as string,
    occasion: row.occasion as string | undefined,
    strapBand: row.strap_band as string | undefined,
    notes: row.notes as string | undefined,
  };
}

export async function getWearLogsByWatchId(
  db: SQLiteDatabase,
  watchId: number,
  limit?: number
): Promise<WearLog[]> {
  const query = limit
    ? 'SELECT * FROM wear_logs WHERE watch_id = ? ORDER BY wear_date DESC LIMIT ?'
    : 'SELECT * FROM wear_logs WHERE watch_id = ? ORDER BY wear_date DESC';
  const params = limit ? [watchId, limit] : [watchId];
  const rows = await db.getAllAsync<Record<string, unknown>>(query, params);
  return rows.map(rowToWearLog);
}

export async function getWearLogsByDate(
  db: SQLiteDatabase,
  date: string
): Promise<(WearLog & { watchBrand: string; watchModelName: string; coverPhotoUri?: string })[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT wl.*, w.brand as watch_brand, w.model_name as watch_model_name,
       p.photo_uri as cover_photo_uri
     FROM wear_logs wl
     JOIN watches w ON w.id = wl.watch_id
     LEFT JOIN watch_photos p ON p.watch_id = wl.watch_id AND p.photo_type = 'WATCH'
       AND p.id = (SELECT MIN(id) FROM watch_photos WHERE watch_id = wl.watch_id AND photo_type = 'WATCH')
     WHERE wl.wear_date = ?
     ORDER BY wl.id ASC`,
    [date]
  );
  return rows.map((row) => ({
    ...rowToWearLog(row),
    watchBrand: row.watch_brand as string,
    watchModelName: row.watch_model_name as string,
    coverPhotoUri: row.cover_photo_uri as string | undefined,
  }));
}

export async function getWearLogsByMonth(
  db: SQLiteDatabase,
  year: number,
  month: number
): Promise<WearLog[]> {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM wear_logs WHERE strftime('%Y-%m', wear_date) = ? ORDER BY wear_date ASC",
    [monthStr]
  );
  return rows.map(rowToWearLog);
}

export async function getLastWearDateByWatchId(
  db: SQLiteDatabase,
  watchId: number
): Promise<string | null> {
  const result = await db.getFirstAsync<{ wear_date: string }>(
    'SELECT wear_date FROM wear_logs WHERE watch_id = ? ORDER BY wear_date DESC LIMIT 1',
    [watchId]
  );
  return result?.wear_date ?? null;
}

export async function getTodayWearLogs(
  db: SQLiteDatabase
): Promise<(WearLog & { watchBrand: string; watchModelName: string; coverPhotoUri?: string })[]> {
  const today = new Date().toISOString().split('T')[0];
  return getWearLogsByDate(db, today);
}

export async function getWearStats(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<Array<{ watchId: number; watchBrand: string; watchModelName: string; count: number }>> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT wl.watch_id, w.brand as watch_brand, w.model_name as watch_model_name,
       COUNT(*) as count
     FROM wear_logs wl
     JOIN watches w ON w.id = wl.watch_id
     WHERE wl.wear_date BETWEEN ? AND ?
     GROUP BY wl.watch_id
     ORDER BY count DESC`,
    [startDate, endDate]
  );
  return rows.map((row) => ({
    watchId: row.watch_id as number,
    watchBrand: row.watch_brand as string,
    watchModelName: row.watch_model_name as string,
    count: row.count as number,
  }));
}

export async function insertWearLog(
  db: SQLiteDatabase,
  log: Omit<WearLog, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO wear_logs (watch_id, user_id, wear_date, occasion, strap_band, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      log.watchId,
      log.userId ?? null,
      log.wearDate,
      log.occasion ?? null,
      log.strapBand ?? null,
      log.notes ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateWearLog(
  db: SQLiteDatabase,
  id: number,
  data: Partial<WearLog>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.wearDate !== undefined) { fields.push('wear_date = ?'); values.push(data.wearDate); }
  if (data.occasion !== undefined) { fields.push('occasion = ?'); values.push(data.occasion ?? null); }
  if (data.strapBand !== undefined) { fields.push('strap_band = ?'); values.push(data.strapBand ?? null); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes ?? null); }

  if (fields.length === 0) return;
  values.push(String(id));

  await db.runAsync(
    `UPDATE wear_logs SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteWearLog(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM wear_logs WHERE id = ?', [id]);
}

export async function getDatesWithWearLogs(
  db: SQLiteDatabase,
  year: number,
  month: number
): Promise<string[]> {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const rows = await db.getAllAsync<{ wear_date: string }>(
    "SELECT DISTINCT wear_date FROM wear_logs WHERE strftime('%Y-%m', wear_date) = ? ORDER BY wear_date",
    [monthStr]
  );
  return rows.map((r) => r.wear_date);
}
