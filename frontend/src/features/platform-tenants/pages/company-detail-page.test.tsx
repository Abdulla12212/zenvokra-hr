import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { CompanyDetailPage } from './company-detail-page';

const {
  getTenant,
  listTenantAdmins,
  createTenantAdmin,
  deleteTenantAdmin,
} = vi.hoisted(() => ({
  getTenant: vi.fn(),
  listTenantAdmins: vi.fn(),
  createTenantAdmin: vi.fn(),
  deleteTenantAdmin: vi.fn(),
}));

vi.mock('../api/tenants-api', () => ({
  listTenants: vi.fn(),
  createTenant: vi.fn(),
  getTenant,
  updateTenant: vi.fn(),
  deleteTenant: vi.fn(),
  listTenantAdmins,
  createTenantAdmin,
  updateTenantAdmin: vi.fn(),
  deleteTenantAdmin,
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

const tenantId = '01936f7a-0000-7000-8000-000000000001';

const acme = {
  id: tenantId,
  name: 'Acme Consulting',
  slug: 'acme-consulting',
  isActive: true,
  adminCount: 0,
  createdAtUtc: '2026-08-23T12:00:00+00:00',
  updatedAtUtc: '2026-08-23T12:00:00+00:00',
};

const admin = {
  id: '01936f7a-0000-7000-8000-000000000002',
  email: 'hr@acme.test',
  createdAtUtc: '2026-08-23T12:00:00+00:00',
  updatedAtUtc: '2026-08-23T12:00:00+00:00',
};

function renderDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/tenants/:tenantId" element={<CompanyDetailPage />} />
    </Routes>,
    { route: `/tenants/${tenantId}` },
  );
}

describe('CompanyDetailPage', () => {
  beforeEach(() => {
    getTenant.mockReset();
    listTenantAdmins.mockReset();
    createTenantAdmin.mockReset();
    deleteTenantAdmin.mockReset();
    getTenant.mockResolvedValue(acme);
    listTenantAdmins.mockResolvedValue(page([]));
  });

  it('asks for a tenant admin when none exist', async () => {
    renderDetail();

    expect(await screen.findByText(/add at least one admin/i)).toBeInTheDocument();
  });

  it('adds a tenant admin and refreshes the list', async () => {
    createTenantAdmin.mockResolvedValue(admin);
    listTenantAdmins.mockResolvedValueOnce(page([])).mockResolvedValue(page([admin]));

    renderDetail();
    await screen.findByText(/add at least one admin/i);

    await userEvent.click(screen.getByRole('button', { name: /add tenant admin/i }));
    await userEvent.type(screen.getByLabelText(/^email$/i), 'hr@acme.test');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'admin-pass');
    await userEvent.click(screen.getByRole('button', { name: /add admin/i }));

    await waitFor(() => {
      expect(createTenantAdmin).toHaveBeenCalledWith(tenantId, {
        email: 'hr@acme.test',
        password: 'admin-pass',
      });
    });

    expect(await screen.findByText('hr@acme.test')).toBeInTheDocument();
  });

  it('removes a tenant admin', async () => {
    listTenantAdmins.mockResolvedValue(page([admin]));
    deleteTenantAdmin.mockResolvedValue(undefined);

    renderDetail();

    expect(await screen.findByText('hr@acme.test')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(deleteTenantAdmin).toHaveBeenCalledWith(tenantId, admin.id);
    });
  });
});
