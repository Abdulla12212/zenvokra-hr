import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { InboxPage } from './inbox-page';

const { listInbox } = vi.hoisted(() => ({
  listInbox: vi.fn(),
}));

vi.mock('../api/inbox-api', () => ({
  listInbox,
}));

describe('InboxPage', () => {
  beforeEach(() => {
    listInbox.mockReset();
  });

  it('renders inbox rows and actions', async () => {
    listInbox.mockResolvedValue([
      {
        id: 'leave-1',
        kind: 'leave',
        title: '25–26 Aug waiting on Nadia',
        detail: 'Sent today 09:41',
        badgeLabel: 'Leave',
        badgeVariant: 'late',
        actionLabel: 'Open',
        actionTo: '/time-off/leave-1',
        unread: true,
      },
      {
        id: 'checked-in',
        kind: 'in',
        title: 'Checked in 09:02',
        detail: 'Dhaka',
        badgeLabel: 'In',
        badgeVariant: 'present',
        unread: false,
      },
    ]);

    renderWithProviders(<InboxPage />);

    expect(await screen.findByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByText('25–26 Aug waiting on Nadia')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/time-off/leave-1');
    expect(screen.getByText('Checked in 09:02')).toBeInTheDocument();
  });

  it('shows an empty inbox', async () => {
    listInbox.mockResolvedValue([]);

    renderWithProviders(<InboxPage />);

    expect(await screen.findByText('Nothing waiting.')).toBeInTheDocument();
  });
});
