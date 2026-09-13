import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { AdminEmployeeDetailPage } from './admin-employee-detail-page';

const { getEmployee, getEmployeeAttendance, getEmployeeLeave } = vi.hoisted(() => ({
  getEmployee: vi.fn(),
  getEmployeeAttendance: vi.fn(),
  getEmployeeLeave: vi.fn(),
}));

vi.mock('../api/employees-api', () => ({
  getEmployee,
  getEmployeeAttendance,
  getEmployeeLeave,
  listEmployees: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  getCurrentEmployee: vi.fn(),
}));

const ada = {
  id: 'emp-1',
  fullName: 'Ada Lovelace',
  employeeNumber: 'EMP-1001',
  workEmail: 'ada@acme.test',
  title: 'Engineer',
  departmentName: 'Engineering',
  location: 'London',
  managerName: '',
  startedOn: '2024-01-12',
  hoursLabel: '09:00–18:00',
  workingDaysLabel: 'Mon–Fri',
  timeZone: 'UTC',
  emergencyContact: '',
  employmentType: 'Full-time',
  phone: '',
  teamName: '',
  deskLabel: '',
  status: 'Active',
};

describe('AdminEmployeeDetailPage', () => {
  beforeEach(() => {
    getEmployee.mockReset().mockResolvedValue(ada);
    getEmployeeAttendance.mockReset().mockResolvedValue([
      {
        day: 13,
        weekend: false,
        today: true,
        selected: true,
        inRange: false,
        kind: 'today',
        metaSecondary: 'Active',
      },
    ]);
    getEmployeeLeave.mockReset().mockResolvedValue({
      balances: [{ type: 'Annual', remaining: 18, total: 20 }],
      requests: [
        {
          id: 'leave-1',
          type: 'Annual',
          datesLabel: '25–26 Sep 2026',
          days: 2,
          status: 'pending',
          statusLabel: 'Pending · Nadia',
          note: 'Family visit',
          sentLabel: 'Sent 13 Sep',
        },
      ],
    });
  });

  it('shows the employee and switches to the leave tab', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/employees/:employeeId" element={<AdminEmployeeDetailPage />} />
      </Routes>,
      { route: '/admin/employees/emp-1' },
    );

    expect(await screen.findByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByText('EMP-1001 · Engineer · Engineering')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /leave & balances/i }));

    expect(await screen.findByText('18 / 20')).toBeInTheDocument();
    expect(screen.getByText('Family visit')).toBeInTheDocument();
  });
});
