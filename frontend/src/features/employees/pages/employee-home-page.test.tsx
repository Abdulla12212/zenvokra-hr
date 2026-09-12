import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { EmployeeHomePage } from './employee-home-page';

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

const ada = {
  id: '01936f7a-0000-7000-8000-000000000010',
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

describe('EmployeeHomePage', () => {
  beforeEach(() => {
    getCurrentEmployee.mockReset();
  });

  it('shows the signed-in employee', async () => {
    getCurrentEmployee.mockResolvedValue(ada);

    renderWithProviders(<EmployeeHomePage companyName="Acme Consulting" />);

    expect(await screen.findByText(/signed in as ada lovelace/i)).toBeInTheDocument();
    expect(screen.getByText(/EMP-1001/)).toBeInTheDocument();
    expect(screen.getByText('Acme Consulting')).toBeInTheDocument();
  });

  it('surfaces a failed request to the user', async () => {
    getCurrentEmployee.mockRejectedValue(new Error('The server could not be reached.'));

    renderWithProviders(<EmployeeHomePage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The server could not be reached.');
  });
});
