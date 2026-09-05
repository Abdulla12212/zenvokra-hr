import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { demoSession } from '@/lib/demo-session';
import { renderEmployeeApp } from '@/test/render-employee-app';

const { getCurrentEmployee } = vi.hoisted(() => ({
  getCurrentEmployee: vi.fn(),
}));

vi.mock('@/features/employees/api/employees-api', () => ({ getCurrentEmployee }));

describe('ProfilePage', () => {
  beforeEach(() => {
    getCurrentEmployee.mockReset();
    getCurrentEmployee.mockResolvedValue({
      id: 'emp-1',
      fullName: demoSession.employee.fullName,
      employeeNumber: demoSession.employee.employeeNumber,
      workEmail: demoSession.employee.workEmail,
      title: demoSession.employee.title,
      departmentName: demoSession.employee.department,
      location: demoSession.location,
      managerName: demoSession.employee.managerName,
      startedOn: '2024-01-12',
      hoursLabel: demoSession.employee.hoursLabel,
      workingDaysLabel: demoSession.employee.workingDaysLabel,
      timeZone: demoSession.employee.timeZone,
      emergencyContact: demoSession.employee.emergencyContact,
      employmentType: demoSession.employee.employmentType,
    });
  });

  it('shows employment and schedule for the seeded employee', async () => {
    renderEmployeeApp('/profile');

    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText(demoSession.employee.title, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(demoSession.employee.managerName)).toBeInTheDocument();
    expect(screen.getByText(demoSession.employee.hoursLabel)).toBeInTheDocument();
    expect(screen.getByText('Record changes go through People Ops.')).toBeInTheDocument();
  });
});
