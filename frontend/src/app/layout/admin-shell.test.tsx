import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { demoSession } from '@/lib/demo-session';
import { renderAdminApp } from '@/test/render-admin-app';

describe('AdminShell', () => {
  it('renders the admin chrome: brand, tenant, and frozen clock', async () => {
    renderAdminApp();

    expect(screen.getByText('Cloudesh Admin')).toBeInTheDocument();
    expect(screen.getByText(demoSession.tenantName)).toBeInTheDocument();
    expect(screen.getByText(demoSession.adminClockLabel)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('lists Dashboard, Employees, Approvals, and Organization — not employee nav', () => {
    renderAdminApp();

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveTextContent('Dashboard');
    expect(nav).toHaveTextContent('Employees');
    expect(nav).toHaveTextContent('Approvals');
    expect(nav).toHaveTextContent('Organization');
    expect(nav).not.toHaveTextContent('Home');
    expect(nav).not.toHaveTextContent('Time off');
    expect(nav).not.toHaveTextContent('Inbox');
  });

  it('navigates between admin destinations', async () => {
    renderAdminApp();

    await userEvent.click(screen.getByRole('link', { name: /Employees/ }));
    expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: /Approvals/ }));
    expect(await screen.findByRole('heading', { name: 'Approvals' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Organization' }));
    expect(await screen.findByRole('heading', { name: 'Organization profile' })).toBeInTheDocument();
  });
});
