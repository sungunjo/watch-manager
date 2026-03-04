import { SQLiteDatabase } from 'expo-sqlite';
import { WatchPhoto } from '../../types';

function rowToPhoto(row: Record<string, unknown>): WatchPhoto {
  return {
    id: row.id as number,
    watchId: row.watch_id as number,
    photoType: row.photo_type as WatchPhoto['photoType'],
    photoUri: row.photo_uri as string,
    caption: row.caption as string | undefined,
    createdAt: row.created_at as string,
  };
}

export async function getPhotosByWatchId(
  db: SQLiteDatabase,
  watchId: number,
  photoType?: WatchPhoto['photoType']
): Promise<WatchPhoto[]> {
  const query = photoType
    ? 'SELECT * FROM watch_photos WHERE watch_id = ? AND photo_type = ? ORDER BY created_at ASC'
    : 'SELECT * FROM watch_photos WHERE watch_id = ? ORDER BY created_at ASC';
  const params = photoType ? [watchId, photoType] : [watchId];
  const rows = await db.getAllAsync<Record<string, unknown>>(query, params);
  return rows.map(rowToPhoto);
}

export async function insertPhoto(
  db: SQLiteDatabase,
  photo: Omit<WatchPhoto, 'id' | 'createdAt'>
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO watch_photos (watch_id, photo_type, photo_uri, caption) VALUES (?, ?, ?, ?)',
    [photo.watchId, photo.photoType, photo.photoUri, photo.caption ?? null]
  );
  return result.lastInsertRowId;
}

export async function deletePhoto(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM watch_photos WHERE id = ?', [id]);
}

export async function deletePhotosByWatchId(db: SQLiteDatabase, watchId: number): Promise<void> {
  await db.runAsync('DELETE FROM watch_photos WHERE watch_id = ?', [watchId]);
}
