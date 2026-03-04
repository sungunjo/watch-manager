import { MovementType, ServiceType, WatchStatus, Currency, MeasurementPosition, CrystalType, PurchaseCondition } from '../types';

// ============================================================
// Color Theme
// ============================================================

export const Colors = {
  primary: '#1a1a2e',
  primaryLight: '#16213e',
  accent: '#e94560',
  accentLight: '#ff6b6b',
  gold: '#c9a84c',
  goldLight: '#f0d080',
  background: '#0f0f1a',
  surface: '#1e1e30',
  surfaceLight: '#2a2a42',
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  textMuted: '#606080',
  border: '#2a2a42',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
};

// ============================================================
// Overhaul Schedule (Default)
// ============================================================

export const DEFAULT_OVERHAUL_SCHEDULES: Array<{
  brandPattern: string;
  intervalMonths: number;
}> = [
  { brandPattern: 'Rolex', intervalMonths: 120 }, // 10년
  { brandPattern: 'Omega', intervalMonths: 72 },  // 6년
  { brandPattern: 'Patek Philippe', intervalMonths: 72 },
  { brandPattern: 'A. Lange & Söhne', intervalMonths: 60 },
  { brandPattern: 'Audemars Piguet', intervalMonths: 60 },
  { brandPattern: 'IWC', intervalMonths: 60 },
  { brandPattern: 'Jaeger-LeCoultre', intervalMonths: 60 },
  { brandPattern: 'Vacheron Constantin', intervalMonths: 60 },
  { brandPattern: 'Grand Seiko', intervalMonths: 60 },  // 5년
  { brandPattern: 'Seiko', intervalMonths: 48 },  // 4년
  { brandPattern: 'Tudor', intervalMonths: 120 },
  { brandPattern: 'TAG Heuer', intervalMonths: 60 },
  { brandPattern: 'Breitling', intervalMonths: 60 },
  { brandPattern: 'Cartier', intervalMonths: 60 },
  { brandPattern: 'Panerai', intervalMonths: 60 },
];

export const DEFAULT_OVERHAUL_INTERVAL_MONTHS = 60; // 5년 (기계식 기본값)

// ============================================================
// Label Maps
// ============================================================

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  [MovementType.MECHANICAL_HAND_WIND]: '수동 기계식',
  [MovementType.MECHANICAL_AUTO]: '자동 기계식',
  [MovementType.QUARTZ]: '쿼츠',
  [MovementType.SPRING_DRIVE]: '스프링 드라이브',
  [MovementType.SMART]: '스마트워치',
};

export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  [WatchStatus.WEARING]: '착용중',
  [WatchStatus.STORED]: '보관중',
  [WatchStatus.IN_SERVICE]: '수리중',
  [WatchStatus.SOLD]: '매각',
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  [ServiceType.OVERHAUL]: '오버홀',
  [ServiceType.POLISH]: '폴리싱',
  [ServiceType.BATTERY_REPLACEMENT]: '배터리 교체',
  [ServiceType.BAND_REPLACEMENT]: '브레이슬릿/스트랩 교체',
  [ServiceType.CRYSTAL_REPLACEMENT]: '크리스탈 교체',
  [ServiceType.WATER_RESISTANCE_TEST]: '방수 테스트',
  [ServiceType.REGULATION]: '레귤레이션',
  [ServiceType.OTHER]: '기타',
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.KRW]: '₩',
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.JPY]: '¥',
  [Currency.CHF]: 'Fr',
  [Currency.GBP]: '£',
  [Currency.HKD]: 'HK$',
};

export const POSITION_LABELS: Record<MeasurementPosition, string> = {
  [MeasurementPosition.DIAL_UP]: '다이얼 위',
  [MeasurementPosition.DIAL_DOWN]: '다이얼 아래',
  [MeasurementPosition.CROWN_UP]: '크라운 위',
  [MeasurementPosition.CROWN_DOWN]: '크라운 아래',
  [MeasurementPosition.CROWN_LEFT]: '크라운 왼쪽',
  [MeasurementPosition.CROWN_RIGHT]: '크라운 오른쪽',
};

export const CRYSTAL_TYPE_LABELS: Record<CrystalType, string> = {
  [CrystalType.SAPPHIRE]: '사파이어',
  [CrystalType.MINERAL]: '미네랄',
  [CrystalType.ACRYLIC]: '아크릴',
  [CrystalType.HARDLEX]: '하드렉스',
};

export const PURCHASE_CONDITION_LABELS: Record<PurchaseCondition, string> = {
  [PurchaseCondition.NEW]: '새제품',
  [PurchaseCondition.USED]: '중고',
  [PurchaseCondition.VINTAGE]: '빈티지',
};

// ============================================================
// App Config
// ============================================================

export const APP_CONFIG = {
  POWER_RESERVE_ALERT_HOURS_BEFORE: 6,
  ACCURACY_ANOMALY_THRESHOLD_SEC: 5.0,
  RECENT_MEASUREMENTS_FOR_AVERAGE: 5,
  OVERHAUL_ALERT_DAYS: [90, 30, 0], // 3개월, 1개월, D-Day
  WARRANTY_ALERT_DAYS: [30, 7],     // 1개월, 1주
  DEFAULT_WEAR_REMINDER_TIME: '09:00',
};

// ============================================================
// Popular Brands (for autocomplete)
// ============================================================

export const POPULAR_BRANDS = [
  'Rolex', 'Omega', 'Patek Philippe', 'A. Lange & Söhne',
  'Audemars Piguet', 'Vacheron Constantin', 'Jaeger-LeCoultre',
  'IWC', 'Breitling', 'TAG Heuer', 'Cartier', 'Panerai',
  'Grand Seiko', 'Seiko', 'Citizen', 'Casio', 'Orient',
  'Tudor', 'Hamilton', 'Longines', 'Tissot', 'Swatch',
  'Nomos', 'Junghans', 'Glashütte Original', 'Union Glashütte',
  'Zenith', 'Hublot', 'Richard Mille', 'F.P. Journe',
  'MB&F', 'H. Moser & Cie', 'Greubel Forsey', 'De Bethune',
];

export const COMMON_COMPLICATIONS = [
  'Date', 'Day-Date', 'Chronograph', 'GMT', 'World Time',
  'Moon Phase', 'Tourbillon', 'Perpetual Calendar',
  'Annual Calendar', 'Power Reserve', 'Alarm', 'Minute Repeater',
  'Flyback', 'Rattrapante', 'Tide', 'Compass', 'Depth Gauge',
];
