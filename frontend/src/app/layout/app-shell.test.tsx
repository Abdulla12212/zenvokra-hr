import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { resetEmployeeAppStore } from '@/lib/employee-app-store';
import { demoSession } from '@/lib/demo-session';
import { renderEmployeeApp } from '@/test/render-employee-app';

function renderShell(path = '/') {
  return renderEmployeeApp(path);
}

describe('AppShell', () => {
  beforeEach(() => {
    resetEmployeeAppStore();
  });

  it('renders the employee chrome: brand, persona, date, and request action', async () => {
    renderShell();

    expect(screen.getByText('Cloudesh')).toBeInTheDocument();
    expect(screen.getByText(demoSession.employee.fullName)).toBeInTheDocument();
    expect(screen.getByText(demoSession.employee.employeeNumber)).toBeInTheDocument();
    expect(screen.getByText(demoSession.location)).toBeInTheDocument();
    expect(
      screen.getByText(`${demoSession.clockLabel} · ${demoSession.employee.timeZone}`),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request time off' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /2 unread/ })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('lists only Home, Time off, and Inbox — no People, Dashboard, or Departments', () => {
    renderShell();

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveTextContent('Home');
    expect(nav).toHaveTextContent('Time off');
    expect(nav).toHaveTextContent('Inbox');
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Departments')).not.toBeInTheDocument();
    expect(screen.queryByText('People')).not.toBeInTheDocument();
    expect(screen.queryByText('Organization')).not.toBeInTheDocument();
  });

  it('marks the active nav item with the accent background, not a blue pill', () => {
    renderShell();

    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(home).toHaveClass('bg-accent');
    expect(home).not.toHaveClass('bg-primary');
  });

  it('navigates between the three employee destinations', async () => {
    renderShell();

    await userEvent.click(screen.getByRole('link', { name: 'Time off' }));
    expect(await screen.findByRole('heading', { name: 'Time off' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Time off' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(screen.getByRole('link', { name: /^Inbox$/ }));
    expect(await screen.findByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
  });
});
