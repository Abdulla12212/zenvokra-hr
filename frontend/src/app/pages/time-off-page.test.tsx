import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { resetEmployeeAppStore } from '@/lib/employee-app-store';
import { renderEmployeeApp } from '@/test/render-employee-app';

describe('TimeOffPage', () => {
  beforeEach(() => {
    resetEmployeeAppStore();
  });

  it('lists balances and the pending request', async () => {
    renderEmployeeApp('/time-off');

    expect(await screen.findByRole('heading', { name: 'Time off' })).toBeInTheDocument();
    expect(screen.getAllByText('Annual').length).toBeGreaterThan(0);
    expect(screen.getByText('25–26 Aug 2026')).toBeInTheDocument();
    expect(screen.getByText('Pending · Nadia')).toBeInTheDocument();
    expect(screen.getByText('Next closed day · 5 Sep')).toBeInTheDocument();
  });

  it('opens request detail and cancels the pending request', async () => {
    renderEmployeeApp('/time-off/aug-25');

    expect(await screen.findByRole('heading', { name: '25–26 Aug' })).toBeInTheDocument();
    expect(screen.getByText('Family visit.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel request' }));

    expect(await screen.findByRole('heading', { name: 'Time off' })).toBeInTheDocument();
    expect(screen.queryByText('25–26 Aug 2026')).not.toBeInTheDocument();
  });
});
