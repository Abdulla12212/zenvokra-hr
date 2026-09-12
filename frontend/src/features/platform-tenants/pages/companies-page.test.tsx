import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { CompaniesPage } from './companies-page';

const { listTenants, createTenant } = vi.hoisted(() => ({
  listTenants: vi.fn(),
  createTenant: vi.fn(),
}));

vi.mock('../api/tenants-api', () => ({
  listTenants,
  createTenant,
  getTenant: vi.fn(),
  updateTenant: vi.fn(),
  deleteTenant: vi.fn(),
  listTenantAdmins: vi.fn(),
  createTenantAdmin: vi.fn(),
  updateTenantAdmin: vi.fn(),
  deleteTenantAdmin: vi.fn(),
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

const acme = {
  id: '01936f7a-0000-7000-8000-000000000001',
  name: 'Acme Consulting',
  slug: 'acme-consulting',
  isActive: true,
  adminCount: 1,
  createdAtUtc: '2026-08-23T12:00:00+00:00',
  updatedAtUtc: '2026-08-23T12:00:00+00:00',
};

describe('CompaniesPage', () => {
  beforeEach(() => {
    listTenants.mockReset();
    createTenant.mockReset();
  });

  it('shows the companies returned by the API', async () => {
    listTenants.mockResolvedValue(page([acme]));

    renderWithProviders(<CompaniesPage />);

    expect(await screen.findByText('Acme Consulting')).toBeInTheDocument();
    expect(screen.getByText('1 company')).toBeInTheDocument();
  });

  it('explains an empty list instead of showing a blank table', async () => {
    listTenants.mockResolvedValue(page([]));

    renderWithProviders(<CompaniesPage />);

    expect(await screen.findByText(/no companies yet/i)).toBeInTheDocument();
  });

  it('surfaces a failed request to the user', async () => {
    listTenants.mockRejectedValue(new Error('The server could not be reached.'));

    renderWithProviders(<CompaniesPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The server could not be reached.');
  });

  it('refetches the list after creating a company', async () => {
    listTenants.mockResolvedValueOnce(page([]));
    createTenant.mockResolvedValue(acme);
    listTenants.mockResolvedValue(page([acme]));

    renderWithProviders(<CompaniesPage />);

    await screen.findByText(/no companies yet/i);

    await userEvent.click(screen.getByRole('button', { name: /add company/i }));
    await userEvent.type(screen.getByLabelText(/company name/i), 'Acme Consulting');
    await userEvent.click(screen.getByRole('button', { name: /create company/i }));

    await waitFor(() => {
      expect(createTenant).toHaveBeenCalledWith({ name: 'Acme Consulting' });
    });

    expect(await screen.findByText('Acme Consulting')).toBeInTheDocument();
  });

  it('rejects a too-short name before calling the API', async () => {
    listTenants.mockResolvedValue(page([]));

    renderWithProviders(<CompaniesPage />);
    await screen.findByText(/no companies yet/i);

    await userEvent.click(screen.getByRole('button', { name: /add company/i }));
    await userEvent.type(screen.getByLabelText(/company name/i), 'A');
    await userEvent.click(screen.getByRole('button', { name: /create company/i }));

    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
    expect(createTenant).not.toHaveBeenCalled();
  });
});
