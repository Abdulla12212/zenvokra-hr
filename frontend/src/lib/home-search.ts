export const sheetNames = ['punch-out', 'fix-punch', 'request', 'punch-log'] as const;

export type SheetName = (typeof sheetNames)[number];

export interface HomeSearch {
  year: number;
  month: number;
  day: number;
  sheet: SheetName | null;
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function monthTitle(year: number, month: number): string {
  return `${monthNames[month - 1] ?? 'Month'} ${String(year)}`;
}

export function isoDate(year: number, month: number, day: number): string {
  return `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { year, month, day };
}

export function addCalendarMonth(
  year: number,
  month: number,
  delta: number,
): {
  year: number;
  month: number;
} {
  const cursor = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function readInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

export function parseHomeSearch(params: URLSearchParams, today = new Date()): HomeSearch {
  const year = readInt(params.get('year'), today.getFullYear());
  const month = Math.min(12, Math.max(1, readInt(params.get('month'), today.getMonth() + 1)));
  const last = daysInMonth(year, month);
  const day = Math.min(last, Math.max(1, readInt(params.get('day'), today.getDate())));
  const sheetParam = params.get('sheet');
  const sheet = sheetNames.find((name) => name === sheetParam) ?? null;

  return { year, month, day, sheet };
}

export function homeHref(next: HomeSearch): string {
  const params = new URLSearchParams();
  params.set('year', String(next.year));
  params.set('month', String(next.month));
  params.set('day', String(next.day));

  if (next.sheet) {
    params.set('sheet', next.sheet);
  }

  return `/?${params.toString()}`;
}
