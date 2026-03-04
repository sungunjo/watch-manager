// ============================================================
// Enums
// ============================================================

export enum MovementType {
  MECHANICAL_HAND_WIND = 'MECHANICAL_HAND_WIND',
  MECHANICAL_AUTO = 'MECHANICAL_AUTO',
  QUARTZ = 'QUARTZ',
  SPRING_DRIVE = 'SPRING_DRIVE',
  SMART = 'SMART',
}

export enum CrystalType {
  SAPPHIRE = 'SAPPHIRE',
  MINERAL = 'MINERAL',
  ACRYLIC = 'ACRYLIC',
  HARDLEX = 'HARDLEX',
}

export enum WatchStatus {
  WEARING = 'WEARING',
  STORED = 'STORED',
  IN_SERVICE = 'IN_SERVICE',
  SOLD = 'SOLD',
}

export enum PurchaseCondition {
  NEW = 'NEW',
  USED = 'USED',
  VINTAGE = 'VINTAGE',
}

export enum Currency {
  KRW = 'KRW',
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY',
  CHF = 'CHF',
  GBP = 'GBP',
  HKD = 'HKD',
}

export enum ServiceType {
  OVERHAUL = 'OVERHAUL',
  POLISH = 'POLISH',
  BATTERY_REPLACEMENT = 'BATTERY_REPLACEMENT',
  BAND_REPLACEMENT = 'BAND_REPLACEMENT',
  CRYSTAL_REPLACEMENT = 'CRYSTAL_REPLACEMENT',
  WATER_RESISTANCE_TEST = 'WATER_RESISTANCE_TEST',
  REGULATION = 'REGULATION',
  OTHER = 'OTHER',
}

export enum MeasurementPosition {
  DIAL_UP = 'DIAL_UP',
  DIAL_DOWN = 'DIAL_DOWN',
  CROWN_UP = 'CROWN_UP',
  CROWN_DOWN = 'CROWN_DOWN',
  CROWN_LEFT = 'CROWN_LEFT',
  CROWN_RIGHT = 'CROWN_RIGHT',
}

export enum NotificationType {
  OVERHAUL_DUE = 'OVERHAUL_DUE',
  WARRANTY_EXPIRY = 'WARRANTY_EXPIRY',
  POWER_RESERVE = 'POWER_RESERVE',
  ACCURACY_ANOMALY = 'ACCURACY_ANOMALY',
  WEAR_REMINDER = 'WEAR_REMINDER',
  SERVICE_COMPLETE = 'SERVICE_COMPLETE',
}

export enum WishlistPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// ============================================================
// Domain Models
// ============================================================

export interface Watch {
  id: number;
  userId?: string;
  brand: string;
  modelName: string;
  referenceNumber?: string;
  serialNumber?: string;
  caliber?: string;
  movementType: MovementType;
  caseDiameterMm?: number;
  caseThicknessMm?: number;
  lugToLugMm?: number;
  lugWidthMm?: number;
  caseMaterial?: string;
  crystalType?: CrystalType;
  waterResistanceM?: number;
  dialColor?: string;
  complications?: string[];
  powerReserveHours?: number;
  frequencyBph?: number;
  nickname?: string;
  notes?: string;
  // Purchase Info
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseCurrency?: Currency;
  purchaseChannel?: string;
  purchaseCondition?: PurchaseCondition;
  warrantyExpiryDate?: string;
  // Status
  status: WatchStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WatchPhoto {
  id: number;
  watchId: number;
  photoType: 'WATCH' | 'RECEIPT' | 'SERVICE';
  photoUri: string;
  caption?: string;
  createdAt: string;
}

export interface Measurement {
  id: number;
  watchId: number;
  measurementDate: string;
  startTime: string;
  endTime?: string;
  referenceStart: string;
  referenceEnd?: string;
  watchStart: string;
  watchEnd?: string;
  dailyRateSec?: number;
  position?: MeasurementPosition;
  notes?: string;
}

export interface ServiceRecord {
  id: number;
  watchId: number;
  serviceType: ServiceType;
  serviceDate: string;
  serviceProvider?: string;
  cost?: number;
  currency?: Currency;
  description?: string;
  completedDate?: string;
  beforeDailyRate?: number;
  afterDailyRate?: number;
}

export interface WearLog {
  id: number;
  watchId: number;
  userId?: string;
  wearDate: string;
  occasion?: string;
  strapBand?: string;
  notes?: string;
}

export interface WishlistItem {
  id: number;
  userId?: string;
  brand: string;
  modelName: string;
  referenceNumber?: string;
  targetPrice?: number;
  currency?: Currency;
  priority?: WishlistPriority;
  photoUri?: string;
  notes?: string;
  addedDate: string;
  convertedWatchId?: number;
}

export interface OverhaulSchedule {
  id: number;
  brandPattern?: string;
  movementType?: MovementType;
  intervalMonths: number;
  isUserCustom: boolean;
  userId?: string;
}

export interface AppNotification {
  id: number;
  userId?: string;
  watchId?: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  scheduledAt?: string;
  createdAt: string;
}

// ============================================================
// UI / View Models
// ============================================================

export interface WatchWithPhotos extends Watch {
  photos: WatchPhoto[];
  coverPhotoUri?: string;
}

export interface WatchListItem {
  id: number;
  brand: string;
  modelName: string;
  referenceNumber?: string;
  movementType: MovementType;
  status: WatchStatus;
  coverPhotoUri?: string;
  nickname?: string;
  lastWornDate?: string;
}

export interface DashboardData {
  todayWatches: WearLog[];
  totalWatches: number;
  activeWatches: number;
  pendingAlerts: AlertSummary[];
  recentActivities: ActivityItem[];
}

export interface AlertSummary {
  type: NotificationType;
  watchId: number;
  watchName: string;
  message: string;
  daysUntil?: number;
}

export interface ActivityItem {
  id: string;
  type: 'WEAR' | 'MEASUREMENT' | 'SERVICE';
  watchId: number;
  watchName: string;
  date: string;
  description: string;
}

// ============================================================
// Form / Input Models
// ============================================================

export interface WatchFormData {
  brand: string;
  modelName: string;
  referenceNumber: string;
  serialNumber: string;
  caliber: string;
  movementType: MovementType;
  caseDiameterMm: string;
  caseThicknessMm: string;
  lugToLugMm: string;
  lugWidthMm: string;
  caseMaterial: string;
  crystalType: CrystalType | '';
  waterResistanceM: string;
  dialColor: string;
  complications: string;
  powerReserveHours: string;
  frequencyBph: string;
  nickname: string;
  notes: string;
  purchaseDate: string;
  purchasePrice: string;
  purchaseCurrency: Currency;
  purchaseChannel: string;
  purchaseCondition: PurchaseCondition | '';
  warrantyExpiryDate: string;
  status: WatchStatus;
}

export interface MeasurementFormData {
  watchId: number;
  watchStart: string;
  watchEnd: string;
  referenceStart: string;
  referenceEnd: string;
  position: MeasurementPosition;
  notes: string;
}

export interface ServiceFormData {
  watchId: number;
  serviceType: ServiceType;
  serviceDate: string;
  serviceProvider: string;
  cost: string;
  currency: Currency;
  description: string;
  completedDate: string;
  beforeDailyRate: string;
  afterDailyRate: string;
}

export interface WearLogFormData {
  watchId: number;
  wearDate: string;
  occasion: string;
  strapBand: string;
  notes: string;
}
