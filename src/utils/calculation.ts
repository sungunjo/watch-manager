/**
 * 일차(Daily Rate) 계산
 * daily_rate = ((watch_elapsed - reference_elapsed) / reference_elapsed) * 86400
 */
export function calculateDailyRate(
  referenceStart: Date,
  referenceEnd: Date,
  watchStart: Date,
  watchEnd: Date
): number {
  const referenceElapsed = (referenceEnd.getTime() - referenceStart.getTime()) / 1000;
  const watchElapsed = (watchEnd.getTime() - watchStart.getTime()) / 1000;

  if (referenceElapsed <= 0) throw new Error('기준 경과 시간이 0 이하입니다.');

  return ((watchElapsed - referenceElapsed) / referenceElapsed) * 86400;
}

/**
 * 파워리저브 소진 예상 시간 계산
 * Returns estimated stop time and alert time
 */
export function calculatePowerReserveStatus(
  lastWornDate: Date,
  powerReserveHours: number,
  alertHoursBefore: number = 6
): {
  estimatedStopTime: Date;
  alertTime: Date;
  isAlertTriggered: boolean;
  hoursRemaining: number;
} {
  const estimatedStopTime = new Date(lastWornDate.getTime() + powerReserveHours * 60 * 60 * 1000);
  const alertTime = new Date(estimatedStopTime.getTime() - alertHoursBefore * 60 * 60 * 1000);
  const now = new Date();
  const hoursRemaining = (estimatedStopTime.getTime() - now.getTime()) / (60 * 60 * 1000);

  return {
    estimatedStopTime,
    alertTime,
    isAlertTriggered: now >= alertTime,
    hoursRemaining: Math.max(0, hoursRemaining),
  };
}

/**
 * 다음 오버홀 예정일 계산
 */
export function calculateNextOverhaulDate(
  lastOverhaulDate: Date,
  intervalMonths: number
): Date {
  const next = new Date(lastOverhaulDate);
  next.setMonth(next.getMonth() + intervalMonths);
  return next;
}

/**
 * 정밀도 이상 감지
 */
export function detectAccuracyAnomaly(
  recentRates: number[],
  latestRate: number,
  threshold: number = 5.0
): boolean {
  if (recentRates.length === 0) return false;
  const average = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;
  return Math.abs(latestRate - average) > threshold;
}

/**
 * 일차 포맷팅
 */
export function formatDailyRate(rate: number): string {
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)} sec/day`;
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 날짜+시간 포맷팅 (YYYY-MM-DD HH:mm)
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * 시간 포맷팅 (HH:mm)
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 상대적 날짜 표현
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
}

/**
 * D-Day 계산 (양수: 미래, 음수: 과거)
 */
export function calculateDDay(targetDateStr: string): number {
  const target = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 통화 포맷팅
 */
export function formatCurrency(amount: number, currency: string): string {
  const currencySymbols: Record<string, string> = {
    KRW: '₩',
    USD: '$',
    EUR: '€',
    JPY: '¥',
    CHF: 'Fr ',
    GBP: '£',
    HKD: 'HK$',
  };

  const symbol = currencySymbols[currency] ?? currency + ' ';

  if (currency === 'KRW' || currency === 'JPY') {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
