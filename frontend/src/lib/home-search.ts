export const calendarMonths = ['august', 'september'] as const;

export type CalendarMonth = (typeof calendarMonths)[number];

export const sheetNames = ['punch-out', 'fix-punch', 'request', 'punch-log'] as const;

export type SheetName = (typeof sheetNames)[number];

export interface HomeSearch {
  month: CalendarMonth;
  day: number;
  sheet: SheetName | null;
}

export function defaultDayFor(month: CalendarMonth): number {
  return month === 'september' ? 5 : 20;
}

export function parseHomeSearch(params: URLSearchParams): HomeSearch {
  const month = params.get('month') === 'september' ? 'september' : 'august';
  const rawDay = Number(params.get('day'));
  const day = Number.isInteger(rawDay) && rawDay >= 1 && rawDay <= 31 ? rawDay : defaultDayFor(month);
  const sheetParam = params.get('sheet');
  const sheet = sheetNames.find((name) => name === sheetParam) ?? null;

  return { month, day, sheet };
}

export function homeHref(next: Partial<HomeSearch>): string {
  const month = next.month ?? 'august';
  const day = next.day ?? defaultDayFor(month);
  const params = new URLSearchParams();

  if (month !== 'august') {
    params.set('month', month);
  }

  if (day !== defaultDayFor(month)) {
    params.set('day', String(day));
  }

  if (next.sheet) {
    params.set('sheet', next.sheet);
  }

  const query = params.toString();
  return query ? `/?${query}` : '/';
}
