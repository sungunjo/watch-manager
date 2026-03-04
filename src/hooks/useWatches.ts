import { useState, useCallback } from 'react';
import { Watch, WatchListItem, MovementType, WatchStatus } from '../types';
import {
  getAllWatches,
  getWatchById,
  getWatchListItems,
  insertWatch,
  updateWatch,
  deleteWatch,
  getWatchBrands,
  getWatchCount,
} from '../database/queries/watch.queries';
import {
  getPhotosByWatchId,
  insertPhoto,
  deletePhoto,
} from '../database/queries/photo.queries';
import { useDb } from './useDatabase';

export function useWatches() {
  const db = useDb();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWatches = useCallback(
    async (options?: {
      search?: string;
      brand?: string;
      movementType?: MovementType;
      status?: WatchStatus;
      sortBy?: 'created_at' | 'brand' | 'model_name' | 'purchase_date';
      sortOrder?: 'ASC' | 'DESC';
    }): Promise<WatchListItem[]> => {
      setLoading(true);
      setError(null);
      try {
        return await getWatchListItems(db, options);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const fetchWatchById = useCallback(
    async (id: number): Promise<Watch | null> => {
      setLoading(true);
      setError(null);
      try {
        return await getWatchById(db, id);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const createWatch = useCallback(
    async (
      watch: Omit<Watch, 'id' | 'createdAt' | 'updatedAt'>,
      photoUris?: string[]
    ): Promise<number | null> => {
      setLoading(true);
      setError(null);
      try {
        const id = await insertWatch(db, watch);
        if (photoUris && photoUris.length > 0) {
          for (const uri of photoUris) {
            await insertPhoto(db, {
              watchId: id,
              photoType: 'WATCH',
              photoUri: uri,
            });
          }
        }
        return id;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const editWatch = useCallback(
    async (
      id: number,
      watch: Partial<Omit<Watch, 'id' | 'createdAt' | 'updatedAt'>>
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await updateWatch(db, id, watch);
        return true;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const removeWatch = useCallback(
    async (id: number): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await deleteWatch(db, id);
        return true;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const fetchBrands = useCallback(async (): Promise<string[]> => {
    try {
      return await getWatchBrands(db);
    } catch {
      return [];
    }
  }, [db]);

  const fetchCount = useCallback(async () => {
    try {
      return await getWatchCount(db);
    } catch {
      return { total: 0, active: 0 };
    }
  }, [db]);

  const fetchPhotos = useCallback(
    async (watchId: number) => {
      try {
        return await getPhotosByWatchId(db, watchId);
      } catch {
        return [];
      }
    },
    [db]
  );

  const addPhoto = useCallback(
    async (watchId: number, uri: string, type: 'WATCH' | 'RECEIPT' | 'SERVICE' = 'WATCH') => {
      try {
        return await insertPhoto(db, { watchId, photoType: type, photoUri: uri });
      } catch {
        return null;
      }
    },
    [db]
  );

  const removePhoto = useCallback(
    async (photoId: number) => {
      try {
        await deletePhoto(db, photoId);
        return true;
      } catch {
        return false;
      }
    },
    [db]
  );

  return {
    loading,
    error,
    fetchWatches,
    fetchWatchById,
    createWatch,
    editWatch,
    removeWatch,
    fetchBrands,
    fetchCount,
    fetchPhotos,
    addPhoto,
    removePhoto,
  };
}
