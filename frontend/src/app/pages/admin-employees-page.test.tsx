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

    await userEvent.click(screen.getByRole('button', { name: '+ Add employee' }));

    expect(await screen.findByRole('dialog', { name: 'Add new employee' })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/employee id/i)).toHaveValue('EMP-1049');
  });
});
