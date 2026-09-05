import { createMemoryRouter, RouterProvider } from 'react-router';

import { AppShell } from '@/app/layout/app-shell';
import { ContinuePage } from '@/app/pages/continue-page';
import { HelpPage } from '@/app/pages/help-page';
import { HomePage } from '@/app/pages/home-page';
import { InboxPage } from '@/app/pages/inbox-page';
import { ProfilePage } from '@/app/pages/profile-page';
import { RequestDetailPage } from '@/app/pages/request-detail-page';
import { TimeOffPage } from '@/app/pages/time-off-page';
import { SessionGate } from '@/app/session-gate';

import { renderWithProviders } from './render-with-providers';

const employeeChildren = [
  { index: true, Component: HomePage },
  { path: 'time-off', Component: TimeOffPage },
  { path: 'time-off/:requestId', Component: RequestDetailPage },
  { path: 'inbox', Component: InboxPage },
  { path: 'profile', Component: ProfilePage },
  { path: 'help', Component: HelpPage },
];

export function renderEmployeeApp(path = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        Component: AppShell,
        children: employeeChildren,
      },
    ],
    { initialEntries: [path] },
  );

  return renderWithProviders(<RouterProvider router={router} />);
}

export function renderGatedApp(path = '/continue') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        Component: SessionGate,
        children: [
          { path: 'continue', Component: ContinuePage },
          { Component: AppShell, children: employeeChildren },
        ],
      },
    ],
    { initialEntries: [path] },
  );

  return renderWithProviders(<RouterProvider router={router} />);
}
