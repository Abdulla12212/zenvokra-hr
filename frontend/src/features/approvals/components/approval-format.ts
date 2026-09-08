import type { ApprovalItem } from '../api/approvals-api';

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

export function splitClock12(value: string): { time: string; period: string } {
  const formatted = formatClock12(value);
  const space = formatted.lastIndexOf(' ');
  if (space < 0) {
    return { time: formatted, period: '' };
  }

  return {
    time: formatted.slice(0, space),
    period: formatted.slice(space + 1),
  };
}

export function requestTypeLabel(item: ApprovalItem): string {
  if (item.kind === 'punch') {
    return 'Late Punch Fix';
  }

  const lower = item.summary.toLowerCase();
  if (lower.includes('sick')) {
    return 'Sick Leave';
  }
  if (lower.includes('casual')) {
    return 'Casual Leave';
  }
  if (lower.includes('annual')) {
    return 'Annual Leave';
  }

  return item.summary;
}

export function drawerTypeLabel(item: ApprovalItem): string {
  if (item.kind === 'punch') {
    return 'Punch Rectification Request';
  }

  return requestTypeLabel(item);
}

export type ApprovalTypeTone = 'punch' | 'sick' | 'leave';

export function requestTypeTone(item: ApprovalItem): ApprovalTypeTone {
  if (item.kind === 'punch') {
    return 'punch';
  }

  if (item.summary.toLowerCase().includes('sick')) {
    return 'sick';
  }

  return 'leave';
}
