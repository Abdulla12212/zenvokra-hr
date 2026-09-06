import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.mock('@/features/leave/api/leave-api', async () => {
  const { leaveApiMock } = await import('@/test/employee-app-api-mocks');
  return leaveApiMock;
});

vi.mock('@/features/attendance/api/attendance-api', async () => {
  const { attendanceApiMock } = await import('@/test/employee-app-api-mocks');
  return attendanceApiMock;
});

vi.mock('@/features/inbox/api/inbox-api', async () => {
  const { inboxApiMock } = await import('@/test/employee-app-api-mocks');
  return inboxApiMock;
});

vi.mock('@/features/employees/api/employees-api', async () => {
  const { employeesApiMock } = await import('@/test/admin-app-api-mocks');
  return employeesApiMock;
});

vi.mock('@/features/dashboard/api/dashboard-api', async () => {
  const { dashboardApiMock } = await import('@/test/admin-app-api-mocks');
  return dashboardApiMock;
});

vi.mock('@/features/approvals/api/approvals-api', async () => {
  const { approvalsApiMock } = await import('@/test/admin-app-api-mocks');
  return approvalsApiMock;
});

vi.mock('@/features/organization/api/organization-api', async () => {
  const { organizationApiMock } = await import('@/test/admin-app-api-mocks');
  return organizationApiMock;
});

// Vitest runs with `globals: false`, so `expect`/`describe`/`it` are imported per file.
// Only cross-cutting setup belongs here.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
