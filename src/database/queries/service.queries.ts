import { SQLiteDatabase } from 'expo-sqlite';
import { ServiceRecord, ServiceType, Currency } from '../../types';

function rowToServiceRecord(row: Record<string, unknown>): ServiceRecord {
  return {
    id: row.id as number,
    watchId: row.watch_id as number,
    serviceType: row.service_type as ServiceType,
    serviceDate: row.service_date as string,
    serviceProvider: row.service_provider as string | undefined,
    cost: row.cost as number | undefined,
    currency: row.currency as Currency | undefined,
    description: row.description as string | undefined,
    completedDate: row.completed_date as string | undefined,
    beforeDailyRate: row.before_daily_rate as number | undefined,
    afterDailyRate: row.after_daily_rate as number | undefined,
  };
}

export async function getServiceRecordsByWatchId(
  db: SQLiteDatabase,
  watchId: number
): Promise<ServiceRecord[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM service_records WHERE watch_id = ? ORDER BY service_date DESC',
    [watchId]
  );
  return rows.map(rowToServiceRecord);
}

export async function getLastOverhaul(
  db: SQLiteDatabase,
  watchId: number
): Promise<ServiceRecord | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM service_records WHERE watch_id = ? AND service_type = 'OVERHAUL' ORDER BY service_date DESC LIMIT 1",
    [watchId]
  );
  if (!row) return null;
  return rowToServiceRecord(row);
}

export async function insertServiceRecord(
  db: SQLiteDatabase,
  record: Omit<ServiceRecord, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO service_records (
      watch_id, service_type, service_date, service_provider,
      cost, currency, description, completed_date,
      before_daily_rate, after_daily_rate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.watchId,
      record.serviceType,
      record.serviceDate,
      record.serviceProvider ?? null,
      record.cost ?? null,
      record.currency ?? null,
      record.description ?? null,
      record.completedDate ?? null,
      record.beforeDailyRate ?? null,
      record.afterDailyRate ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateServiceRecord(
  db: SQLiteDatabase,
  id: number,
  record: Partial<ServiceRecord>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  const fieldMap: Record<string, string> = {
    serviceType: 'service_type',
    serviceDate: 'service_date',
    serviceProvider: 'service_provider',
    cost: 'cost',
    currency: 'currency',
    description: 'description',
    completedDate: 'completed_date',
    beforeDailyRate: 'before_daily_rate',
    afterDailyRate: 'after_daily_rate',
  };

  for (const [key, column] of Object.entries(fieldMap)) {
    if (key in record) {
      fields.push(`${column} = ?`);
      const val = record[key as keyof ServiceRecord];
      values.push(val == null ? null : (val as string | number));
    }
  }

  if (fields.length === 0) return;
  values.push(id);

  await db.runAsync(
    `UPDATE service_records SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteServiceRecord(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM service_records WHERE id = ?', [id]);
}
