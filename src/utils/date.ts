/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 현재 날짜+시간을 ISO 형식으로 반환
 */
export function getNowISOString(): string {
  return new Date().toISOString();
}

/**
 * YYYY-MM-DD 형식의 문자열을 Date 객체로 변환
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/**
 * 월의 모든 날짜 목록 반환 (YYYY-MM-DD 형식)
 */
export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month - 1, day));
  }
  return days;
}

/**
 * 달력 뷰를 위한 날짜 배열 반환 (이전/다음달 포함)
 */
export function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDayOfWeek = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  const days: (Date | null)[] = [];

  // 이전 달 채우기
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // 현재 달
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month - 1, day));
  }

  // 다음 달 채우기 (6주 완성)
  const remaining = 42 - days.length;
  for (let i = 0; i < remaining; i++) {
    days.push(null);
  }

  return days;
}

/**
 * 두 날짜 사이의 일수 차이
 */
export function getDaysDiff(from: Date, to: Date): number {
  const fromDay = new Date(from);
  const toDay = new Date(to);
  fromDay.setHours(0, 0, 0, 0);
  toDay.setHours(0, 0, 0, 0);
  return Math.floor((toDay.getTime() - fromDay.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 날짜에 월 추가
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * 한국어 날짜 포맷 (예: 2026년 3월 4일)
 */
export function formatKoreanDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 한국어 월 포맷 (예: 2026년 3월)
 */
export function formatKoreanMonth(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

/**
 * 시간(HH:mm) 문자열을 Date 객체로 파싱 (오늘 기준)
 */
export function parseTimeToday(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * ISO string을 HH:mm 포맷으로
 */
export function isoToTimeString(isoStr: string): string {
  const date = new Date(isoStr);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
