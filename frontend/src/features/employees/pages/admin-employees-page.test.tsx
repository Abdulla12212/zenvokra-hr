import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { AdminEmployeesPage } from './admin-employees-page';

const { listEmployees, createEmployee, updateEmployee } = vi.hoisted(() => ({
  listEmployees: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
}));

vi.mock('../api/employees-api', () => ({
  listEmployees,
  createEmployee,
  updateEmployee,
  getCurrentEmployee: vi.fn(),
  getEmployee: vi.fn(),
}));

function page<T>(items: T[]) {
  return {
    items,
    page: 1,
    pageSize: 25,
    totalCount: items.length,
    totalPages: 1,
    hasNextPage: false,
  };
}

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

describe('AdminEmployeesPage', () => {
  beforeEach(() => {
    listEmployees.mockReset();
    createEmployee.mockReset();
    updateEmployee.mockReset();
  });

  it('shows the employees returned by the API', async () => {
    listEmployees.mockResolvedValue(page([ada]));

    renderWithProviders(<AdminEmployeesPage />);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('EMP-1001')).toBeInTheDocument();
    expect(screen.getByText('1 employee')).toBeInTheDocument();
  });

  it('explains an empty list instead of showing a blank table', async () => {
    listEmployees.mockResolvedValue(page([]));

    renderWithProviders(<AdminEmployeesPage />);

    expect(await screen.findByText(/no employees yet/i)).toBeInTheDocument();
  });

  it('surfaces a failed request to the user', async () => {
    listEmployees.mockRejectedValue(new Error('The server could not be reached.'));

    renderWithProviders(<AdminEmployeesPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The server could not be reached.');
  });

  it('creates an employee with a password and refetches the list', async () => {
    listEmployees.mockResolvedValueOnce(page([]));
    createEmployee.mockResolvedValue(ada);
    listEmployees.mockResolvedValue(page([ada]));

    renderWithProviders(<AdminEmployeesPage />);

    await screen.findByText(/no employees yet/i);

    await userEvent.click(screen.getByRole('button', { name: /add employee/i }));
    await userEvent.type(screen.getByLabelText(/full name/i), 'Ada Lovelace');
    await userEvent.type(screen.getByLabelText(/work email/i), 'ada@acme.test');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret123');
    await userEvent.type(screen.getByLabelText(/employee number/i), 'EMP-1001');
    await userEvent.type(screen.getByLabelText(/^title$/i), 'Engineer');
    await userEvent.type(screen.getByLabelText(/department/i), 'Engineering');
    await userEvent.type(screen.getByLabelText(/location/i), 'London');
    await userEvent.click(screen.getByRole('button', { name: /create employee/i }));

    await waitFor(() => {
      expect(createEmployee).toHaveBeenCalledWith({
        fullName: 'Ada Lovelace',
        workEmail: 'ada@acme.test',
        password: 'secret123',
        employeeNumber: 'EMP-1001',
        title: 'Engineer',
        departmentName: 'Engineering',
        location: 'London',
      });
    });

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });
});
