import {
  calculateDailyRate,
  calculateNextOverhaulDate,
  calculatePowerReserveAlertTime,
  detectPrecisionAnomaly,
  getOverhaulAlertLevel,
} from '../calculation';

describe('calculateDailyRate', () => {
  it('시계가 하루에 +3초 빠른 경우를 계산한다', () => {
    const refStart = new Date('2026-01-01T00:00:00Z');
    const refEnd = new Date('2026-01-02T00:00:00Z'); // 86400초 경과
    const watchStart = new Date('2026-01-01T00:00:00Z');
    const watchEnd = new Date('2026-01-02T00:00:03Z'); // 86403초 경과 (3초 빠름)

    const result = calculateDailyRate(watchStart, watchEnd, refStart, refEnd);
    expect(result).toBeCloseTo(3, 4);
  });

  it('시계가 하루에 -2초 느린 경우를 계산한다', () => {
    const refStart = new Date('2026-01-01T00:00:00Z');
    const refEnd = new Date('2026-01-02T00:00:00Z');
    const watchStart = new Date('2026-01-01T00:00:00Z');
    const watchEnd = new Date('2026-01-01T23:59:58Z'); // 2초 느림

    const result = calculateDailyRate(watchStart, watchEnd, refStart, refEnd);
    expect(result).toBeCloseTo(-2, 4);
  });

  it('기준 시간이 0이면 에러를 던진다', () => {
    const t = new Date('2026-01-01T00:00:00Z');
    expect(() => calculateDailyRate(t, t, t, t)).toThrow('기준 경과 시간은 0보다 커야 합니다.');
  });
});

describe('calculatePowerReserveAlertTime', () => {
  it('마지막 착용일로부터 파워리저브 소진 6시간 전에 알림을 발생시킨다', () => {
    const lastWear = new Date('2026-01-01T10:00:00Z');
    const alert = calculatePowerReserveAlertTime(lastWear, 48, 6);

    // 10:00 + 48h - 6h = 2026-01-03T04:00:00Z
    expect(alert.toISOString()).toBe('2026-01-03T04:00:00.000Z');
  });

  it('파워리저브가 0 이하면 에러를 던진다', () => {
    const t = new Date();
    expect(() => calculatePowerReserveAlertTime(t, 0)).toThrow(
      '파워리저브 시간은 0보다 커야 합니다.',
    );
  });
});

describe('calculateNextOverhaulDate', () => {
  it('마지막 오버홀에서 60개월(5년) 후 예정일을 계산한다', () => {
    const last = new Date('2021-03-01T00:00:00Z');
    const next = calculateNextOverhaulDate(last, 60);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(2); // 3월 (0-indexed)
  });

  it('Rolex 10년 주기(120개월)를 계산한다', () => {
    const last = new Date('2016-01-15T00:00:00Z');
    const next = calculateNextOverhaulDate(last, 120);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(0); // 1월
  });

  it('주기가 0 이하면 에러를 던진다', () => {
    expect(() => calculateNextOverhaulDate(new Date(), 0)).toThrow(
      '오버홀 주기는 0보다 커야 합니다.',
    );
  });
});

describe('detectPrecisionAnomaly', () => {
  it('최신 측정값이 이전 평균 대비 5초 초과 이상이면 true를 반환한다', () => {
    const measurements = [2, 3, 2, 3, 10]; // 평균 2.5, 최신 10 → 차이 7.5
    expect(detectPrecisionAnomaly(measurements)).toBe(true);
  });

  it('최신 측정값이 이전 평균 대비 5초 이내면 false를 반환한다', () => {
    const measurements = [2, 3, 2, 3, 5]; // 평균 2.5, 최신 5 → 차이 2.5
    expect(detectPrecisionAnomaly(measurements)).toBe(false);
  });

  it('측정값이 1개 이하면 false를 반환한다', () => {
    expect(detectPrecisionAnomaly([5])).toBe(false);
    expect(detectPrecisionAnomaly([])).toBe(false);
  });
});

describe('getOverhaulAlertLevel', () => {
  it('예정일이 지난 경우 due를 반환한다', () => {
    const past = new Date('2020-01-01T00:00:00Z');
    const result = getOverhaulAlertLevel(past, new Date('2026-01-01T00:00:00Z'));
    expect(result).toBe('due');
  });

  it('30일 이내면 1month를 반환한다', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const soon = new Date('2026-01-20T00:00:00Z'); // 19일 후
    expect(getOverhaulAlertLevel(soon, now)).toBe('1month');
  });

  it('31~90일 사이면 3months를 반환한다', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const upcoming = new Date('2026-03-01T00:00:00Z'); // 59일 후
    expect(getOverhaulAlertLevel(upcoming, now)).toBe('3months');
  });

  it('90일 초과면 null을 반환한다', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const far = new Date('2027-01-01T00:00:00Z');
    expect(getOverhaulAlertLevel(far, now)).toBeNull();
  });
});
