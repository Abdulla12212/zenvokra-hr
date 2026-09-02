import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { initialsFromName } from '../lib/initials';
import type { AttendanceRow } from '../types';

import { MonogramAvatar } from './monogram-avatar';
import { PresenceDot } from './presence-dot';

const statusLabel: Record<AttendanceRow['status'], string> = {
  present: 'Present',
  late: 'Late',
  wfh: 'WFH',
  sick: 'Sick leave',
};

export function AttendanceTodayPanel({ rows }: { rows: AttendanceRow[] }) {
  return (
    <section className="bg-card rounded-xl border">
      <h2 className="px-4 py-3 text-sm font-semibold">Attendance today</h2>
      <ul>
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-2 border-t px-4 py-2.5 text-xs first:border-t-0"
          >
            <MonogramAvatar initials={initialsFromName(row.employeeName)} />
            <span className="min-w-0 flex-1 font-medium">{row.employeeName}</span>
            <span className="text-muted-foreground w-10 tabular-nums">{row.clockIn}</span>
            <span className="text-muted-foreground w-10 tabular-nums">{row.clockOut}</span>
            <span className="flex w-24 items-center gap-1.5">
              <PresenceDot status={row.status} />
              {statusLabel[row.status]}
            </span>
            <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Actions for ${row.employeeName}`}>
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
