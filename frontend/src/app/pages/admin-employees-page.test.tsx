import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { demoSession } from '@/lib/demo-session';
import { renderAdminApp } from '@/test/render-admin-app';

describe('AdminEmployeesPage', () => {
  it('lists the tenant roster and opens the add dialog', async () => {
    renderAdminApp('/admin/employees');

    expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument();
    expect(screen.getAllByText(demoSession.employee.fullName).length).toBeGreaterThan(0);
    expect(screen.getByText('EMP-1024')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Leave' })).toBeInTheDocument();
    expect(screen.getByLabelText('25 leave days remaining')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('25 leave days remaining'));
    expect(screen.getByRole('dialog', { name: 'Leave breakdown' })).toBeInTheDocument();
    expect(screen.getByText(/Annual Leave/)).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: 'Add Employee' }));

    expect(await screen.findByRole('dialog', { name: 'Add new employee' })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/employee id/i)).toHaveValue('EMP-1049');
  });
});
