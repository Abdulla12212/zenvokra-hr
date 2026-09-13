import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { EmployeeProfilePage } from './employee-profile-page';

const { getCurrentEmployee } = vi.hoisted(() => ({
  getCurrentEmployee: vi.fn(),
}));

vi.mock('../api/employees-api', () => ({
  getCurrentEmployee,
  listEmployees: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  getEmployee: vi.fn(),
}));

describe('EmployeeProfilePage', () => {
  beforeEach(() => {
    getCurrentEmployee.mockReset();
  });

  it('shows employment and schedule', async () => {
    getCurrentEmployee.mockResolvedValue({
      id: '01936f7a-0000-7000-8000-000000000010',
      fullName: 'Ada Lovelace',
      employeeNumber: 'EMP-1001',
      workEmail: 'ada@acme.test',
      title: 'Engineer',
      departmentName: 'Engineering',
      location: 'London',
      managerName: 'Nadia Khan',
      startedOn: '2024-01-12',
      hoursLabel: '09:00–18:00',
      workingDaysLabel: 'Mon–Fri',
      timeZone: 'UTC',
      emergencyContact: 'Father · +1',
      employmentType: 'Full-time',
      phone: '',
      teamName: '',
      deskLabel: '',
      status: 'Active',
    });

    renderWithProviders(<EmployeeProfilePage />);

    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('09:00–18:00')).toBeInTheDocument();
    expect(screen.getByText('Record changes go through People Ops.')).toBeInTheDocument();
  });
});
