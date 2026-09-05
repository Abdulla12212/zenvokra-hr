import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { demoSession } from '@/lib/demo-session';
import { resetEmployeeAppStore } from '@/lib/employee-app-store';
import { resetContinuedSession } from '@/lib/session-stub';
import { renderGatedApp } from '@/test/render-employee-app';

describe('ContinuePage', () => {
  beforeEach(() => {
    resetContinuedSession();
    resetEmployeeAppStore();
  });

  it('shows the seeded employee and continues into Home', async () => {
    renderGatedApp('/continue');

    expect(screen.getByRole('heading', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByText(demoSession.employee.fullName)).toBeInTheDocument();
    expect(screen.getByText(/EMP-1024/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(await screen.findByText('Clocked in at 09:02')).toBeInTheDocument();
  });

  it('sends an uncontinued visitor to Continue', () => {
    renderGatedApp('/');

    expect(screen.getByRole('heading', { name: 'Continue' })).toBeInTheDocument();
  });
});
