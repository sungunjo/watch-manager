import {
  calculateDailyRate,
  calculateNextOverhaulDate,
  calculatePowerReserveStatus,
  detectAccuracyAnomaly,
  formatDailyRate,
  formatDate,
  formatRelativeDate,
  calculateDDay,
  formatCurrency,
} from '../calculation';

describe('calculateDailyRate', () => {
  it('시계가 하루에 +3초 빠른 경우를 계산한다', () => {
    const refStart = new Date('2026-01-01T00:00:00Z');
    const refEnd = new Date('2026-01-02T00:00:00Z');
    const watchStart = new Date('2026-01-01T00:00:00Z');
    const watchEnd = new Date('2026-01-02T00:00:03Z');

    const result = calculateDailyRate(refStart, refEnd, watchStart, watchEnd);
    expect(result).toBeCloseTo(3, 4);
  });

  it('시계가 하루에 -2초 느린 경우를 계산한다', () => {
    const refStart = new Date('2026-01-01T00:00:00Z');
    const refEnd = new Date('2026-01-02T00:00:00Z');
    const watchStart = new Date('2026-01-01T00:00:00Z');
    const watchEnd = new Date('2026-01-01T23:59:58Z');

    const result = calculateDailyRate(refStart, refEnd, watchStart, watchEnd);
    expect(result).toBeCloseTo(-2, 4);
  });

  it('기준 시간이 0이면 에러를 던진다', () => {
    const t = new Date('2026-01-01T00:00:00Z');
    expect(() => calculateDailyRate(t, t, t, t)).toThrow('기준 경과 시간이 0 이하입니다.');
  });
});

describe('calculatePowerReserveStatus', () => {
  it('마지막 착용일로부터 파워리저브 상태를 계산한다', () => {
    const lastWorn = new Date('2026-01-01T10:00:00Z');
    const status = calculatePowerReserveStatus(lastWorn, 48, 6);

    expect(status.estimatedStopTime.toISOString()).toBe('2026-01-03T10:00:00.000Z');
    expect(status.alertTime.toISOString()).toBe('2026-01-03T04:00:00.000Z');
  });
});

describe('calculateNextOverhaulDate', () => {
  it('마지막 오버홀에서 60개월(5년) 후 예정일을 계산한다', () => {
    const last = new Date('2021-03-01T00:00:00Z');
    const next = calculateNextOverhaulDate(last, 60);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(2);
  });

  it('Rolex 10년 주기(120개월)를 계산한다', () => {
    const last = new Date('2016-01-15T00:00:00Z');
    const next = calculateNextOverhaulDate(last, 120);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(0);
  });
});

describe('detectAccuracyAnomaly', () => {
  it('최신 측정값이 평균 대비 threshold 초과면 true 반환', () => {
    const rates = [2, 3, 2, 3];
    expect(detectAccuracyAnomaly(rates, 10)).toBe(true);
  });

  it('최신 측정값이 평균 대비 threshold 이내면 false 반환', () => {
    const rates = [2, 3, 2, 3];
    expect(detectAccuracyAnomaly(rates, 5)).toBe(false);
  });

  it('측정값이 비어있으면 false 반환', () => {
    expect(detectAccuracyAnomaly([], 5)).toBe(false);
  });
});

describe('formatDailyRate', () => {
  it('+3초를 "+3.0 sec/day"로 포맷한다', () => {
    expect(formatDailyRate(3)).toBe('+3.0 sec/day');
  });

  it('-1.5초를 "-1.5 sec/day"로 포맷한다', () => {
    expect(formatDailyRate(-1.5)).toBe('-1.5 sec/day');
  });
});

describe('formatDate', () => {
  it('날짜를 YYYY-MM-DD 형식으로 포맷한다', () => {
    const date = new Date(2026, 0, 15);
    expect(formatDate(date)).toBe('2026-01-15');
  });
});

describe('calculateDDay', () => {
  it('미래 날짜면 양수를 반환한다', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(calculateDDay(future.toISOString())).toBe(10);
  });

  it('과거 날짜면 음수를 반환한다', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(calculateDDay(past.toISOString())).toBe(-5);
  });
});

describe('formatCurrency', () => {
  it('KRW 포맷', () => {
    expect(formatCurrency(1500000, 'KRW')).toBe('₩1,500,000');
  });

  it('USD 포맷', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
  });
});
