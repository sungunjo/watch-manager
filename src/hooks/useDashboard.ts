import { useState, useCallback } from 'react';
import { useDb } from './useDatabase';
import { WatchStatus, NotificationType } from '../types';
import { getTodayString } from '../utils/date';
import { calculateDDay } from '../utils/calculation';
import { DEFAULT_OVERHAUL_INTERVAL_MONTHS } from '../constants';

export interface TodayWearEntry {
  id: number;
  watchId: number;
  watchBrand: string;
  watchModelName: string;
  watchNickname?: string;
  coverPhotoUri?: string;
  occasion?: string;
  strapBand?: string;
}

export interface CollectionStats {
  total: number;
  wearing: number;
  stored: number;
  inService: number;
}

export interface AlertItem {
  type: NotificationType;
  watchId: number;
  watchName: string;
  message: string;
  daysUntil: number;
}

export interface ActivityItem {
  id: string;
  type: 'WEAR' | 'SERVICE';
  watchId: number;
  watchName: string;
  date: string;
  description: string;
}

export interface DashboardState {
  todayLogs: TodayWearEntry[];
  stats: CollectionStats;
  alerts: AlertItem[];
  recentActivity: ActivityItem[];
  wearStreakDays: number;
  totalWearThisMonth: number;
}

export function useDashboard() {
  const db = useDb();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardState>({
    todayLogs: [],
    stats: { total: 0, wearing: 0, stored: 0, inService: 0 },
    alerts: [],
    recentActivity: [],
    wearStreakDays: 0,
    totalWearThisMonth: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = getTodayString();
      const [year, monthNum] = today.split('-').map(Number);
      const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;

      // Today's wear logs with watch info
      const todayRows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT wl.id, wl.watch_id, w.brand as watch_brand, w.model_name as watch_model_name,
           w.nickname as watch_nickname, wl.occasion, wl.strap_band,
           p.photo_uri as cover_photo_uri
         FROM wear_logs wl
         JOIN watches w ON w.id = wl.watch_id
         LEFT JOIN watch_photos p ON p.watch_id = wl.watch_id AND p.photo_type = 'WATCH'
           AND p.id = (SELECT MIN(id) FROM watch_photos WHERE watch_id = wl.watch_id AND photo_type = 'WATCH')
         WHERE wl.wear_date = ?
         ORDER BY wl.id ASC`,
        [today]
      );
      const todayLogs: TodayWearEntry[] = todayRows.map((r) => ({
        id: r.id as number,
        watchId: r.watch_id as number,
        watchBrand: r.watch_brand as string,
        watchModelName: r.watch_model_name as string,
        watchNickname: r.watch_nickname as string | undefined,
        coverPhotoUri: r.cover_photo_uri as string | undefined,
        occasion: r.occasion as string | undefined,
        strapBand: r.strap_band as string | undefined,
      }));

      // Collection stats
      const statsRows = await db.getAllAsync<{ status: string; cnt: number }>(
        `SELECT status, COUNT(*) as cnt FROM watches WHERE is_active = 1 GROUP BY status`
      );
      const stats: CollectionStats = { total: 0, wearing: 0, stored: 0, inService: 0 };
      for (const row of statsRows) {
        stats.total += row.cnt;
        if (row.status === WatchStatus.WEARING) stats.wearing = row.cnt;
        else if (row.status === WatchStatus.STORED) stats.stored = row.cnt;
        else if (row.status === WatchStatus.IN_SERVICE) stats.inService = row.cnt;
      }

      // Alerts: warranty expiry within 30 days
      const warrantyRows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT id, brand, model_name, nickname, warranty_expiry_date
         FROM watches WHERE is_active = 1 AND warranty_expiry_date IS NOT NULL
           AND warranty_expiry_date > ? AND warranty_expiry_date <= date(?, '+30 days')
         ORDER BY warranty_expiry_date ASC`,
        [today, today]
      );
      const alerts: AlertItem[] = warrantyRows.map((r) => {
        const daysUntil = calculateDDay(r.warranty_expiry_date as string);
        const name = `${r.brand} ${(r.nickname as string) || (r.model_name as string)}`;
        return {
          type: NotificationType.WARRANTY_EXPIRY,
          watchId: r.id as number,
          watchName: name,
          message: daysUntil === 0 ? '오늘 워런티 만료' : `${Math.abs(daysUntil)}일 후 워런티 만료`,
          daysUntil,
        };
      });

      // Alerts: overhaul due (purchase_date + interval, no overhaul in service_records)
      const overhaulRows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT w.id, w.brand, w.model_name, w.nickname, w.purchase_date,
           MAX(CASE WHEN sr.service_type = 'OVERHAUL' THEN sr.service_date END) as last_overhaul
         FROM watches w
         LEFT JOIN service_records sr ON sr.watch_id = w.id
         WHERE w.is_active = 1 AND w.status != 'SOLD'
           AND (w.movement_type = 'MECHANICAL_AUTO' OR w.movement_type = 'MECHANICAL_HAND_WIND'
                OR w.movement_type = 'SPRING_DRIVE')
         GROUP BY w.id`,
      );
      const overhaulAlertDays = 90;
      for (const r of overhaulRows) {
        const baseDate = (r.last_overhaul as string) || (r.purchase_date as string);
        if (!baseDate) continue;
        const nextDate = new Date(baseDate);
        nextDate.setMonth(nextDate.getMonth() + DEFAULT_OVERHAUL_INTERVAL_MONTHS);
        const daysUntil = calculateDDay(nextDate.toISOString().split('T')[0]);
        if (daysUntil <= overhaulAlertDays) {
          const name = `${r.brand} ${(r.nickname as string) || (r.model_name as string)}`;
          const message =
            daysUntil < 0
              ? `오버홀 ${Math.abs(daysUntil)}일 초과`
              : daysUntil === 0
              ? '오버홀 D-Day'
              : `오버홀 D-${daysUntil}`;
          alerts.push({
            type: NotificationType.OVERHAUL_DUE,
            watchId: r.id as number,
            watchName: name,
            message,
            daysUntil,
          });
        }
      }
      // Sort alerts: overdue first, then by days remaining
      alerts.sort((a, b) => a.daysUntil - b.daysUntil);

      // Recent activity: last 10 wear logs + last 5 service records
      const wearActivityRows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT wl.id, wl.watch_id, w.brand, w.model_name, w.nickname,
           wl.wear_date as date, wl.occasion
         FROM wear_logs wl
         JOIN watches w ON w.id = wl.watch_id
         ORDER BY wl.wear_date DESC, wl.id DESC
         LIMIT 8`,
      );
      const serviceActivityRows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT sr.id, sr.watch_id, w.brand, w.model_name, w.nickname,
           sr.service_date as date, sr.service_type
         FROM service_records sr
         JOIN watches w ON w.id = sr.watch_id
         ORDER BY sr.service_date DESC, sr.id DESC
         LIMIT 5`,
      );

      const SERVICE_TYPE_SHORT: Record<string, string> = {
        OVERHAUL: '오버홀',
        POLISH: '폴리싱',
        BATTERY_REPLACEMENT: '배터리 교체',
        BAND_REPLACEMENT: '스트랩 교체',
        CRYSTAL_REPLACEMENT: '크리스탈 교체',
        WATER_RESISTANCE_TEST: '방수 테스트',
        REGULATION: '레귤레이션',
        OTHER: '기타 서비스',
      };

      const activities: ActivityItem[] = [
        ...wearActivityRows.map((r) => ({
          id: `wear-${r.id}`,
          type: 'WEAR' as const,
          watchId: r.watch_id as number,
          watchName: `${r.brand} ${(r.nickname as string) || (r.model_name as string)}`,
          date: r.date as string,
          description: (r.occasion as string) || '착용',
        })),
        ...serviceActivityRows.map((r) => ({
          id: `service-${r.id}`,
          type: 'SERVICE' as const,
          watchId: r.watch_id as number,
          watchName: `${r.brand} ${(r.nickname as string) || (r.model_name as string)}`,
          date: r.date as string,
          description: SERVICE_TYPE_SHORT[r.service_type as string] || '서비스',
        })),
      ]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10);

      // Wear stats for this month
      const monthCountResult = await db.getFirstAsync<{ cnt: number }>(
        "SELECT COUNT(*) as cnt FROM wear_logs WHERE strftime('%Y-%m', wear_date) = ?",
        [monthStr]
      );
      const totalWearThisMonth = monthCountResult?.cnt ?? 0;

      // Streak: consecutive days with at least one wear log ending today
      const recentDateRows = await db.getAllAsync<{ wear_date: string }>(
        "SELECT DISTINCT wear_date FROM wear_logs ORDER BY wear_date DESC LIMIT 60"
      );
      const wearDateSet = new Set(recentDateRows.map((r) => r.wear_date));
      let streak = 0;
      const cursor = new Date(today + 'T00:00:00');
      while (wearDateSet.has(cursor.toISOString().split('T')[0])) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }

      setData({
        todayLogs,
        stats,
        alerts,
        recentActivity: activities,
        wearStreakDays: streak,
        totalWearThisMonth,
      });
    } catch (e) {
      console.error('useDashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  return { loading, data, load };
}
