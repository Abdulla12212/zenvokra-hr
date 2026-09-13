import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { AdminOrganizationPage } from './admin-organization-page';

const { getOrganization, updateOrganization } = vi.hoisted(() => ({
  getOrganization: vi.fn(),
  updateOrganization: vi.fn(),
}));

vi.mock('../api/organization-api', () => ({
  getOrganization,
  updateOrganization,
}));

const profile = {
  id: 'org-1',
  displayName: 'Northwind Traders',
  workEmail: 'hr@northwind.test',
  supportHotline: '',
  officeLandline: '',
  websiteUrl: '',
  industry: 'Trade',
  fiscalYear: 'January – December',
  workingDays: 'Mon,Tue,Wed,Thu,Fri',
  shiftTiming: '09:00–18:00',
  officeFloors: '',
  legalName: 'Northwind Traders',
  clientCode: 'NORTHWIND-TRADERS',
  subscriptionTier: 'Standard',
  contractPeriod: '—',
  seatLimit: 100,
  activeSeats: 4,
  regionTimeZone: 'UTC',
  supportSla: '—',
  registeredOffice: '',
};

describe('AdminOrganizationPage', () => {
  beforeEach(() => {
    getOrganization.mockReset();
    updateOrganization.mockReset();
  });

  it('shows company defaults and locked plan fields', async () => {
    getOrganization.mockResolvedValue(profile);

    renderWithProviders(<AdminOrganizationPage />);

    expect(await screen.findByDisplayValue('Northwind Traders')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('4 / 100')).toBeInTheDocument();
    expect(screen.getByText(/locked · entered by the platform owner/i)).toBeInTheDocument();
  });

  it('saves contact fields without sending plan fields', async () => {
    getOrganization.mockResolvedValue(profile);
    updateOrganization.mockResolvedValue({ ...profile, displayName: 'Northwind' });

    renderWithProviders(<AdminOrganizationPage />);

    const name = await screen.findByLabelText(/company display name/i);
    await userEvent.clear(name);
    await userEvent.type(name, 'Northwind');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateOrganization).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Northwind',
          workEmail: 'hr@northwind.test',
        }),
      );
    });

    const payload = updateOrganization.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('seatLimit');
    expect(payload).not.toHaveProperty('subscriptionTier');
  });
});
