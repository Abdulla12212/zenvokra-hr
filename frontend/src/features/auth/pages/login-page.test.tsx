import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-client';
import { renderWithProviders } from '@/test/render-with-providers';

import { LoginPage } from './login-page';

const { getCurrentUser, login } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
}));

vi.mock('../api/auth-api', () => ({ getCurrentUser, login, logout: vi.fn() }));

const platformSession = {
  userId: '01936f7a-0000-7000-8000-000000000001',
  email: 'owner@cloudesh.test',
  role: 'PlatformAdmin' as const,
  tenantId: null,
  tenantName: null,
};

describe('LoginPage', () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    login.mockReset();
    getCurrentUser.mockResolvedValue(null);
  });

  it('rejects an invalid email before calling the API', async () => {
    renderWithProviders(<LoginPage />);

    await userEvent.type(await screen.findByLabelText(/email/i), 'not-an-email');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('surfaces a failed sign-in', async () => {
    login.mockRejectedValue(new ApiError(401, 'Invalid email or password.'));

    renderWithProviders(<LoginPage />);

    await userEvent.type(await screen.findByLabelText(/email/i), 'owner@cloudesh.test');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('signs in with the typed credentials', async () => {
    login.mockResolvedValue(platformSession);

    renderWithProviders(<LoginPage />);

    await userEvent.type(await screen.findByLabelText(/email/i), 'owner@cloudesh.test');
    await userEvent.type(screen.getByLabelText(/password/i), 'cloudesh-dev');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'owner@cloudesh.test',
        password: 'cloudesh-dev',
      });
    });
  });
});
