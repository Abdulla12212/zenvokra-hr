import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { resetEmployeeAppStore } from '@/lib/employee-app-store';
import { renderEmployeeApp } from '@/test/render-employee-app';

describe('HomePage', () => {
  beforeEach(() => {
    resetEmployeeAppStore();
  });

  it('shows today’s shift, the month grid, and the late banner', async () => {
    renderEmployeeApp('/');

    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('Clocked in at 09:02')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'August 2026' })).toBeInTheDocument();
    expect(screen.getByText('19 Aug marked late')).toBeInTheDocument();
    expect(screen.getByText('6h 32m 43s')).toBeInTheDocument();
    expect(screen.getByText('32h 32m / 40h')).toBeInTheDocument();
  });

  it('punches out from the sheet and then punches back in', async () => {
    renderEmployeeApp('/?sheet=punch-out');

    expect(await screen.findByRole('heading', { name: 'Punch out' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Punch out' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Punch out' })).not.toBeInTheDocument();
    });
    expect(await screen.findByText('Not clocked in')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Punch in' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Punch in' }));

    expect(await screen.findByText('Clocked in at 09:02')).toBeInTheDocument();
  });

  it('opens September on the closed day and returns via Today', async () => {
    renderEmployeeApp('/?month=september&day=5');

    expect(await screen.findByRole('heading', { name: 'September 2026' })).toBeInTheDocument();
    expect(screen.getByText('Company Day')).toBeInTheDocument();
    expect(
      screen.getByText('Quota is still this week in August. September is preview only.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Today' }));

    expect(await screen.findByRole('heading', { name: 'August 2026' })).toBeInTheDocument();
  });

  it('saves a late-day stamp and hides the banner', async () => {
    renderEmployeeApp('/?sheet=fix-punch&day=19');

    expect(await screen.findByRole('heading', { name: 'Fix punch · 19 Aug' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save stamp' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Fix punch · 19 Aug' })).not.toBeInTheDocument();
    });
    expect(screen.queryByText('19 Aug marked late')).not.toBeInTheDocument();
  });
});
