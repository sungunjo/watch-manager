import { SQLiteDatabase } from 'expo-sqlite';
import { Watch, WatchListItem, WatchStatus, MovementType } from '../../types';

function rowToWatch(row: Record<string, unknown>): Watch {
  return {
    id: row.id as number,
    userId: row.user_id as string | undefined,
    brand: row.brand as string,
    modelName: row.model_name as string,
    referenceNumber: row.reference_number as string | undefined,
    serialNumber: row.serial_number as string | undefined,
    caliber: row.caliber as string | undefined,
    movementType: row.movement_type as MovementType,
    caseDiameterMm: row.case_diameter_mm as number | undefined,
    caseThicknessMm: row.case_thickness_mm as number | undefined,
    lugToLugMm: row.lug_to_lug_mm as number | undefined,
    lugWidthMm: row.lug_width_mm as number | undefined,
    caseMaterial: row.case_material as string | undefined,
    crystalType: row.crystal_type as Watch['crystalType'],
    waterResistanceM: row.water_resistance_m as number | undefined,
    dialColor: row.dial_color as string | undefined,
    complications: row.complications
      ? JSON.parse(row.complications as string)
      : undefined,
    powerReserveHours: row.power_reserve_hours as number | undefined,
    frequencyBph: row.frequency_bph as number | undefined,
    nickname: row.nickname as string | undefined,
    notes: row.notes as string | undefined,
    purchaseDate: row.purchase_date as string | undefined,
    purchasePrice: row.purchase_price as number | undefined,
    purchaseCurrency: row.purchase_currency as Watch['purchaseCurrency'],
    purchaseChannel: row.purchase_channel as string | undefined,
    purchaseCondition: row.purchase_condition as Watch['purchaseCondition'],
    warrantyExpiryDate: row.warranty_expiry_date as string | undefined,
    status: row.status as WatchStatus,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getAllWatches(db: SQLiteDatabase): Promise<Watch[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM watches WHERE is_active = 1 ORDER BY created_at DESC'
  );
  return rows.map(rowToWatch);
}

export async function getWatchById(db: SQLiteDatabase, id: number): Promise<Watch | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM watches WHERE id = ?',
    [id]
  );
  if (!row) return null;
  return rowToWatch(row);
}

export async function getWatchListItems(
  db: SQLiteDatabase,
  options?: {
    search?: string;
    brand?: string;
    movementType?: MovementType;
    status?: WatchStatus;
    sortBy?: 'created_at' | 'brand' | 'model_name' | 'purchase_date';
    sortOrder?: 'ASC' | 'DESC';
  }
): Promise<WatchListItem[]> {
  const {
    search,
    brand,
    movementType,
    status,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = options || {};

  const conditions: string[] = ['w.is_active = 1'];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push('(w.brand LIKE ? OR w.model_name LIKE ? OR w.reference_number LIKE ?)');
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }
  if (brand) {
    conditions.push('w.brand = ?');
    params.push(brand);
  }
  if (movementType) {
    conditions.push('w.movement_type = ?');
    params.push(movementType);
  }
  if (status) {
    conditions.push('w.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT
      w.id, w.brand, w.model_name, w.reference_number,
      w.movement_type, w.status, w.nickname,
      p.photo_uri as cover_photo_uri,
      MAX(wl.wear_date) as last_worn_date
    FROM watches w
    LEFT JOIN watch_photos p ON p.watch_id = w.id AND p.photo_type = 'WATCH'
      AND p.id = (SELECT MIN(id) FROM watch_photos WHERE watch_id = w.id AND photo_type = 'WATCH')
    LEFT JOIN wear_logs wl ON wl.watch_id = w.id
    ${whereClause}
    GROUP BY w.id
    ORDER BY w.${sortBy} ${sortOrder}
  `;

  const rows = await db.getAllAsync<Record<string, unknown>>(query, params);
  return rows.map((row) => ({
    id: row.id as number,
    brand: row.brand as string,
    modelName: row.model_name as string,
    referenceNumber: row.reference_number as string | undefined,
    movementType: row.movement_type as MovementType,
    status: row.status as WatchStatus,
    coverPhotoUri: row.cover_photo_uri as string | undefined,
    nickname: row.nickname as string | undefined,
    lastWornDate: row.last_worn_date as string | undefined,
  }));
}

export async function insertWatch(
  db: SQLiteDatabase,
  watch: Omit<Watch, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO watches (
      user_id, brand, model_name, reference_number, serial_number, caliber,
      movement_type, case_diameter_mm, case_thickness_mm, lug_to_lug_mm, lug_width_mm,
      case_material, crystal_type, water_resistance_m, dial_color, complications,
      power_reserve_hours, frequency_bph, nickname, notes,
      purchase_date, purchase_price, purchase_currency, purchase_channel,
      purchase_condition, warranty_expiry_date, status, is_active
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?
    )`,
    [
      watch.userId ?? null,
      watch.brand,
      watch.modelName,
      watch.referenceNumber ?? null,
      watch.serialNumber ?? null,
      watch.caliber ?? null,
      watch.movementType,
      watch.caseDiameterMm ?? null,
      watch.caseThicknessMm ?? null,
      watch.lugToLugMm ?? null,
      watch.lugWidthMm ?? null,
      watch.caseMaterial ?? null,
      watch.crystalType ?? null,
      watch.waterResistanceM ?? null,
      watch.dialColor ?? null,
      watch.complications ? JSON.stringify(watch.complications) : null,
      watch.powerReserveHours ?? null,
      watch.frequencyBph ?? null,
      watch.nickname ?? null,
      watch.notes ?? null,
      watch.purchaseDate ?? null,
      watch.purchasePrice ?? null,
      watch.purchaseCurrency ?? null,
      watch.purchaseChannel ?? null,
      watch.purchaseCondition ?? null,
      watch.warrantyExpiryDate ?? null,
      watch.status,
      watch.isActive ? 1 : 0,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateWatch(
  db: SQLiteDatabase,
  id: number,
  watch: Partial<Omit<Watch, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  const fieldMap: Record<string, string> = {
    brand: 'brand',
    modelName: 'model_name',
    referenceNumber: 'reference_number',
    serialNumber: 'serial_number',
    caliber: 'caliber',
    movementType: 'movement_type',
    caseDiameterMm: 'case_diameter_mm',
    caseThicknessMm: 'case_thickness_mm',
    lugToLugMm: 'lug_to_lug_mm',
    lugWidthMm: 'lug_width_mm',
    caseMaterial: 'case_material',
    crystalType: 'crystal_type',
    waterResistanceM: 'water_resistance_m',
    dialColor: 'dial_color',
    powerReserveHours: 'power_reserve_hours',
    frequencyBph: 'frequency_bph',
    nickname: 'nickname',
    notes: 'notes',
    purchaseDate: 'purchase_date',
    purchasePrice: 'purchase_price',
    purchaseCurrency: 'purchase_currency',
    purchaseChannel: 'purchase_channel',
    purchaseCondition: 'purchase_condition',
    warrantyExpiryDate: 'warranty_expiry_date',
    status: 'status',
    isActive: 'is_active',
  };

  for (const [key, column] of Object.entries(fieldMap)) {
    if (key in watch) {
      fields.push(`${column} = ?`);
      const val = watch[key as keyof typeof watch];
      if (key === 'complications' && Array.isArray(val)) {
        values.push(JSON.stringify(val));
      } else if (key === 'isActive') {
        values.push(val ? 1 : 0);
      } else {
        values.push(val == null ? null : (val as string | number));
      }
    }
  }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  await db.runAsync(
    `UPDATE watches SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteWatch(db: SQLiteDatabase, id: number): Promise<void> {
  // Soft delete: is_active = 0
  await db.runAsync(
    "UPDATE watches SET is_active = 0, updated_at = datetime('now') WHERE id = ?",
    [id]
  );
}

export async function getWatchBrands(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ brand: string }>(
    'SELECT DISTINCT brand FROM watches WHERE is_active = 1 ORDER BY brand'
  );
  return rows.map((r) => r.brand);
}

export async function getWatchCount(db: SQLiteDatabase): Promise<{ total: number; active: number }> {
  const result = await db.getFirstAsync<{ total: number; active: number }>(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('WEARING', 'STORED') THEN 1 ELSE 0 END) as active
    FROM watches
    WHERE is_active = 1
  `);
  return result ?? { total: 0, active: 0 };
}
