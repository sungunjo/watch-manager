import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, DATABASE_NAME } from './schema';
import { DEFAULT_OVERHAUL_SCHEDULES } from '../constants';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(CREATE_TABLES_SQL);
  await seedDefaultOverhaulSchedules(database);
}

async function seedDefaultOverhaulSchedules(database: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM overhaul_schedules WHERE is_user_custom = 0'
  );

  if (existing && existing.count > 0) return;

  for (const schedule of DEFAULT_OVERHAUL_SCHEDULES) {
    await database.runAsync(
      'INSERT INTO overhaul_schedules (brand_pattern, interval_months, is_user_custom) VALUES (?, ?, 0)',
      [schedule.brandPattern, schedule.intervalMonths]
    );
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
