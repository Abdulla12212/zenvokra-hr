import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { MonthCalendar } from './month-calendar';

const { getAttendanceCalendar } = vi.hoisted(() => ({
  getAttendanceCalendar: vi.fn(),
}));

vi.mock('../api/attendance-api', async () => {
  const actual = await vi.importActual('../api/attendance-api');
  return {
    ...actual,
    getAttendanceCalendar,
  };
});

const cells = [
  {
    day: 5,
    weekend: false,
    today: false,
    selected: false,
    inRange: false,
    kind: 'present' as const,
    metaPrimary: '8h',
  },
  {
    day: 13,
    weekend: true,
    today: true,
    selected: true,
    inRange: false,
    kind: 'today' as const,
  },
];

describe('MonthCalendar', () => {
  beforeEach(() => {
    getAttendanceCalendar.mockReset().mockResolvedValue(cells);
  });

  it('selects one day without refetching the month', async () => {
    const user = userEvent.setup();
    const search = { year: 2026, month: 9, day: 13, sheet: null };

    renderWithProviders(
      <MonthCalendar search={search} todayIso="2026-09-13" />,
      { route: '/?year=2026&month=9&day=13' },
    );

    expect(await screen.findByRole('heading', { name: 'September 2026' })).toBeInTheDocument();
    expect(getAttendanceCalendar).toHaveBeenCalledOnce();
    expect(getAttendanceCalendar).toHaveBeenCalledWith(2026, 9, expect.anything());

    await user.click(screen.getByRole('button', { name: '5 8h' }));

    expect(getAttendanceCalendar).toHaveBeenCalledOnce();
  });
});
