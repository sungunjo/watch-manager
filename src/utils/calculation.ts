/**
 * SPEC 9.2 핵심 비즈니스 로직 구현
 */

/**
 * 일차(Daily Rate) 계산
 * daily_rate = ((watch_elapsed - reference_elapsed) / reference_elapsed) * 86400
 *
 * @param watchStart  시계 시작 시각 (사용자 입력)
 * @param watchEnd    시계 종료 시각 (사용자 입력)
 * @param referenceStart  기준 시작 시각 (NTP/단말기)
 * @param referenceEnd    기준 종료 시각 (NTP/단말기)
 * @returns 일차 (초/일). +는 빠름, -는 느림
 */
export function calculateDailyRate(
  watchStart: Date,
  watchEnd: Date,
  referenceStart: Date,
  referenceEnd: Date,
): number {
  const watchElapsed = (watchEnd.getTime() - watchStart.getTime()) / 1000;
  const referenceElapsed = (referenceEnd.getTime() - referenceStart.getTime()) / 1000;

  if (referenceElapsed <= 0) {
    throw new Error('기준 경과 시간은 0보다 커야 합니다.');
  }

  return ((watchElapsed - referenceElapsed) / referenceElapsed) * 86400;
}

/**
 * 파워리저브 소진 예상 시각 계산
 *
 * @param lastWearDate    마지막 착용일
 * @param powerReserveHours  파워리저브 (시간)
 * @param alertBeforeHours   알림 시점 (소진 N시간 전, 기본 6시간)
 * @returns 알림 발생 시각
 */
export function calculatePowerReserveAlertTime(
  lastWearDate: Date,
  powerReserveHours: number,
  alertBeforeHours: number = 6,
): Date {
  if (powerReserveHours <= 0) {
    throw new Error('파워리저브 시간은 0보다 커야 합니다.');
  }

  const estimatedStopTime = new Date(
    lastWearDate.getTime() + powerReserveHours * 60 * 60 * 1000,
  );
  return new Date(estimatedStopTime.getTime() - alertBeforeHours * 60 * 60 * 1000);
}

/**
 * 다음 오버홀 예정일 계산
 *
 * @param lastOverhaulDate  마지막 오버홀 일자 (없으면 구매일)
 * @param intervalMonths    권장 오버홀 주기 (개월)
 * @returns 다음 오버홀 예정일
 */
export function calculateNextOverhaulDate(
  lastOverhaulDate: Date,
  intervalMonths: number,
): Date {
  if (intervalMonths <= 0) {
    throw new Error('오버홀 주기는 0보다 커야 합니다.');
  }

  const next = new Date(lastOverhaulDate);
  next.setMonth(next.getMonth() + intervalMonths);
  return next;
}

/**
 * 정밀도 이상 감지
 * 최근 5회 측정 평균 대비 최신 측정값이 ±5초 이상 차이나면 이상으로 판단
 *
 * @param recentMeasurements  최근 측정 일차 배열 (일차/일)
 * @returns 이상 여부
 */
export function detectPrecisionAnomaly(recentMeasurements: number[]): boolean {
  if (recentMeasurements.length < 2) {
    return false;
  }

  const latest = recentMeasurements[recentMeasurements.length - 1];
  const previous = recentMeasurements.slice(0, -1);
  const average = previous.reduce((sum, v) => sum + v, 0) / previous.length;

  return Math.abs(latest - average) > 5.0;
}

/**
 * 오버홀 알림 발생 여부 확인
 *
 * @param nextOverhaulDate  다음 오버홀 예정일
 * @param now               현재 시각 (기본: 현재)
 * @returns 알림 단계: 'due' | '1month' | '3months' | null
 */
export function getOverhaulAlertLevel(
  nextOverhaulDate: Date,
  now: Date = new Date(),
): 'due' | '1month' | '3months' | null {
  const diffMs = nextOverhaulDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 0) return 'due';
  if (diffDays <= 30) return '1month';
  if (diffDays <= 90) return '3months';
  return null;
}
