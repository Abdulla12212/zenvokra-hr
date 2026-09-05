import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { demoSession } from '@/lib/demo-session';
import { renderWithProviders } from '@/test/render-with-providers';

import { HomePage } from '../pages/home-page';
import { InboxPage } from '../pages/inbox-page';
import { TimeOffPage } from '../pages/time-off-page';
import { AppShell } from './app-shell';

function renderShell(path = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        Component: AppShell,
        children: [
          { index: true, Component: HomePage },
          { path: 'time-off', Component: TimeOffPage },
          { path: 'inbox', Component: InboxPage },
        ],
      },
    ],
    { initialEntries: [path] },
  );

  return renderWithProviders(<RouterProvider router={router} />);
}

describe('AppShell', () => {
  it('renders the employee chrome: brand, persona, date, and request action', () => {
    renderShell();

    expect(screen.getByText('Cloudesh')).toBeInTheDocument();
    expect(screen.getByText(demoSession.employee.fullName)).toBeInTheDocument();
    expect(screen.getByText(demoSession.employee.employeeNumber)).toBeInTheDocument();
    expect(screen.getByText(demoSession.location)).toBeInTheDocument();
    expect(
      screen.getByText(`${demoSession.clockLabel} · ${demoSession.employee.timeZone}`),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request time off' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /2 unread/ })).toBeInTheDocument();
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
    expect(screen.getByRole('heading', { name: 'Time off' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Time off' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(screen.getByRole('link', { name: /^Inbox$/ }));
    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
  });
});
