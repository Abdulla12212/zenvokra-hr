import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { DepartmentsPage } from './departments-page';

/*
 * WALKING SKELETON: delete alongside the Departments feature.
 *
 * The shape to copy: mock the feature's api module (the boundary), never the query
 * hooks. That way the test exercises the real hooks, the real cache invalidation, and
 * the real component tree — the parts that actually break.
 */

const { listDepartments, createDepartment } = vi.hoisted(() => ({
  listDepartments: vi.fn(),
  createDepartment: vi.fn(),
}));

vi.mock('../api/departments-api', () => ({ listDepartments, createDepartment }));

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

const engineering = {
  id: '01936f7a-0000-7000-8000-000000000001',
  name: 'Engineering',
  createdAtUtc: '2026-08-23T12:00:00+00:00',
};

describe('DepartmentsPage', () => {
  beforeEach(() => {
    listDepartments.mockReset();
    createDepartment.mockReset();
  });

  it('shows the departments returned by the API', async () => {
    listDepartments.mockResolvedValue(page([engineering]));

    renderWithProviders(<DepartmentsPage />);

    expect(await screen.findByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('1 department')).toBeInTheDocument();
  });

  it('explains an empty list instead of showing a blank table', async () => {
    listDepartments.mockResolvedValue(page([]));

    renderWithProviders(<DepartmentsPage />);

    expect(await screen.findByText(/no departments yet/i)).toBeInTheDocument();
  });

  it('surfaces a failed request to the user', async () => {
    listDepartments.mockRejectedValue(new Error('The server could not be reached.'));

    renderWithProviders(<DepartmentsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The server could not be reached.');
  });

  it('refetches the list after creating a department', async () => {
    listDepartments.mockResolvedValueOnce(page([]));
    createDepartment.mockResolvedValue(engineering);
    listDepartments.mockResolvedValue(page([engineering]));

    renderWithProviders(<DepartmentsPage />);

    await screen.findByText(/no departments yet/i);

    await userEvent.type(screen.getByLabelText(/department name/i), 'Engineering');
    await userEvent.click(screen.getByRole('button', { name: /add department/i }));

    await waitFor(() => {
      expect(createDepartment).toHaveBeenCalledWith({ name: 'Engineering' });
    });

    expect(await screen.findByText('Engineering')).toBeInTheDocument();
  });

  it('rejects a too-short name before calling the API', async () => {
    listDepartments.mockResolvedValue(page([]));

    renderWithProviders(<DepartmentsPage />);
    await screen.findByText(/no departments yet/i);

    await userEvent.type(screen.getByLabelText(/department name/i), 'A');
    await userEvent.click(screen.getByRole('button', { name: /add department/i }));

    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
    expect(createDepartment).not.toHaveBeenCalled();
  });
});
