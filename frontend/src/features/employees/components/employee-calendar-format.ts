import type { EmployeeCalendarCell } from '../api/employees-api';

const WEEKDAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function formatClock12(value: string | null | undefined): string {
  if (value == null || value === '' || value === '—' || value === '--') {
    return '--';
  }

  if (/[AP]M/i.test(value)) {
    return value;
  }

  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (match === null) {
    return value;
  }

  const hour24 = Number(match[1]);
  const minute = match[2];
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const padded = hour12 < 10 ? `0${String(hour12)}` : String(hour12);
  return `${padded}:${minute} ${period}`;
}

export function weekdayName(day: number): string {
  return WEEKDAYS[(day - 1) % 7] ?? 'Day';
}

export function weekdayShort(day: number): string {
  return weekdayName(day).slice(0, 3);
}

export function expectedOutFromHours(hoursLabel: string): string {
  const parts = hoursLabel.split(/[–-]/);
  return formatClock12(parts[1]?.trim());
}

export function outsideMonthDay(index: number, cells: EmployeeCalendarCell[]): number | null {
  const first = cells.findIndex((cell) => cell.day !== null);
  const last = cells.findLastIndex((cell) => cell.day !== null);

  if (first < 0 || last < 0) {
    return null;
  }

  if (index < first) {
    return 31 - (first - 1 - index);
  }

  if (index > last) {
    return index - last;
  }

  return null;
}

export function drawerStatus(kind: string): string {
  if (kind === 'today') return 'Active On Duty';
  if (kind === 'late') return 'Late Arrival';
  if (kind === 'leave') return 'Leave';
  if (kind === 'weekend') return 'Weekend Off';
  if (kind === 'present') return 'Completed';
  if (kind === 'closed') return 'Closed';
  return 'Upcoming Schedule';
}

export function workSchedule(cell: EmployeeCalendarCell, hoursLabel: string): string {
  if (cell.kind === 'weekend') return 'Weekend Off';
  if (cell.kind === 'leave') return cell.metaSecondary ?? 'Leave Day';
  if (cell.kind === 'closed') return 'Closed';
  return `Regular Day (${hoursLabel.replace('–', ' - ')})`;
}

export function verificationNote(cell: EmployeeCalendarCell): string {
  if (cell.note) return cell.note;
  if (cell.kind === 'weekend') return 'Scheduled weekly rest day';
  if (cell.kind === 'leave') return 'Leave recorded for this date';
  if (cell.kind === 'late') return 'Late punch recorded';
  if (cell.kind === 'today') return 'On duty';
  if (cell.kind === 'present') return 'Attendance recorded';
  if (cell.kind === 'closed') return 'Office closed';
  return 'Scheduled regular workday';
}
