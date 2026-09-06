import { createMemoryRouter, RouterProvider } from 'react-router';

import { AdminShell } from '@/app/layout/admin-shell';
import { AdminApprovalsPage } from '@/app/pages/admin-approvals-page';
import { AdminDashboardPage } from '@/app/pages/admin-dashboard-page';
import { AdminEmployeePage } from '@/app/pages/admin-employee-page';
import { AdminEmployeesPage } from '@/app/pages/admin-employees-page';
import { AdminOrganizationPage } from '@/app/pages/admin-organization-page';

import { renderWithProviders } from './render-with-providers';

const adminChildren = [
  { index: true, Component: AdminDashboardPage },
  { path: 'employees', Component: AdminEmployeesPage },
  { path: 'employees/:employeeId', Component: AdminEmployeePage },
  { path: 'approvals', Component: AdminApprovalsPage },
  { path: 'organization', Component: AdminOrganizationPage },
];

export function renderAdminApp(path = '/admin') {
  const router = createMemoryRouter(
    [
      {
        path: '/admin',
        Component: AdminShell,
        children: adminChildren,
      },
    ],
    { initialEntries: [path] },
  );

  return renderWithProviders(<RouterProvider router={router} />);
}

export { adminChildren };
