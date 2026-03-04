// SQLite 스키마 정의 (expo-sqlite 사용)
// DDL 문자열로 정의하여 migration에 사용

export const CREATE_TABLES_SQL = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS watches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    brand TEXT NOT NULL,
    model_name TEXT NOT NULL,
    reference_number TEXT,
    serial_number TEXT,
    caliber TEXT,
    movement_type TEXT NOT NULL DEFAULT 'MECHANICAL_AUTO',
    case_diameter_mm REAL,
    case_thickness_mm REAL,
    lug_to_lug_mm REAL,
    lug_width_mm REAL,
    case_material TEXT,
    crystal_type TEXT,
    water_resistance_m INTEGER,
    dial_color TEXT,
    complications TEXT,
    power_reserve_hours INTEGER,
    frequency_bph INTEGER,
    nickname TEXT,
    notes TEXT,
    purchase_date TEXT,
    purchase_price REAL,
    purchase_currency TEXT DEFAULT 'KRW',
    purchase_channel TEXT,
    purchase_condition TEXT,
    warranty_expiry_date TEXT,
    status TEXT NOT NULL DEFAULT 'STORED',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS watch_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    watch_id INTEGER NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
    photo_type TEXT NOT NULL DEFAULT 'WATCH',
    photo_uri TEXT NOT NULL,
    caption TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    watch_id INTEGER NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
    measurement_date TEXT NOT NULL DEFAULT (datetime('now')),
    start_time TEXT NOT NULL,
    end_time TEXT,
    reference_start TEXT NOT NULL,
    reference_end TEXT,
    watch_start TEXT NOT NULL,
    watch_end TEXT,
    daily_rate_sec REAL,
    position TEXT DEFAULT 'DIAL_UP',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS service_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    watch_id INTEGER NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    service_date TEXT NOT NULL,
    service_provider TEXT,
    cost REAL,
    currency TEXT DEFAULT 'KRW',
    description TEXT,
    completed_date TEXT,
    before_daily_rate REAL,
    after_daily_rate REAL
  );

  CREATE TABLE IF NOT EXISTS wear_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    watch_id INTEGER NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
    user_id TEXT,
    wear_date TEXT NOT NULL,
    occasion TEXT,
    strap_band TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    brand TEXT NOT NULL,
    model_name TEXT NOT NULL,
    reference_number TEXT,
    target_price REAL,
    currency TEXT DEFAULT 'KRW',
    priority TEXT DEFAULT 'MEDIUM',
    photo_uri TEXT,
    notes TEXT,
    added_date TEXT NOT NULL DEFAULT (date('now')),
    converted_watch_id INTEGER REFERENCES watches(id)
  );

  CREATE TABLE IF NOT EXISTS overhaul_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_pattern TEXT,
    movement_type TEXT,
    interval_months INTEGER NOT NULL DEFAULT 60,
    is_user_custom INTEGER NOT NULL DEFAULT 0,
    user_id TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    watch_id INTEGER REFERENCES watches(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    scheduled_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_watches_brand ON watches(brand);
  CREATE INDEX IF NOT EXISTS idx_watches_status ON watches(status);
  CREATE INDEX IF NOT EXISTS idx_measurements_watch_id ON measurements(watch_id);
  CREATE INDEX IF NOT EXISTS idx_service_records_watch_id ON service_records(watch_id);
  CREATE INDEX IF NOT EXISTS idx_wear_logs_watch_id ON wear_logs(watch_id);
  CREATE INDEX IF NOT EXISTS idx_wear_logs_date ON wear_logs(wear_date);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
`;

export const DATABASE_VERSION = 1;
export const DATABASE_NAME = 'watch_manager.db';
