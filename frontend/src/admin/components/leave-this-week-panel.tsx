import { cn } from '@/lib/utils';

import type { LeaveDay } from '../types';

export function LeaveThisWeekPanel({ days }: { days: LeaveDay[] }) {
  return (
    <section className="bg-card rounded-xl border">
      <h2 className="px-4 py-3 text-sm font-semibold">Leave this week</h2>
      <div className="grid grid-cols-5 gap-px border-t">
        {days.map((day) => (
          <div key={day.key} className="px-2 py-3">
            <p className="text-muted-foreground text-center text-[11px]">{day.label}</p>
            <p
              className={cn(
                'mb-2 text-center text-[11px]',
                day.isToday ? 'text-primary font-medium' : 'text-muted-foreground',
              )}
            >
              {day.dateLabel}
            </p>
            {day.people.length === 0 ? (
              <p className="text-muted-foreground text-center text-[11px]">—</p>
            ) : (
              <ul className="space-y-1">
                {day.people.map((person) => (
                  <li key={person} className="text-center text-[11px] leading-tight">
                    {person}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
