import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { resetEmployeeAppStore } from '@/lib/employee-app-store';
import { renderEmployeeApp } from '@/test/render-employee-app';

describe('InboxPage', () => {
  beforeEach(() => {
    resetEmployeeAppStore();
  });

  it('lists leave, late punch, check-in, and the closed day', async () => {
    renderEmployeeApp('/inbox');

    expect(await screen.findByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByText('25–26 Aug waiting on Nadia')).toBeInTheDocument();
    expect(screen.getByText('19 Aug marked late')).toBeInTheDocument();
    expect(screen.getByText('Checked in 09:02')).toBeInTheDocument();
    expect(screen.getByText('Office closed 5 Sep')).toBeInTheDocument();
  });

  it('opens the pending request from Inbox', async () => {
    renderEmployeeApp('/inbox');

    await userEvent.click(await screen.findByRole('link', { name: 'Open' }));

    expect(await screen.findByRole('heading', { name: '25–26 Aug' })).toBeInTheDocument();
  });
});
