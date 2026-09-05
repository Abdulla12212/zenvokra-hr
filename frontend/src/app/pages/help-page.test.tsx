import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderEmployeeApp } from '@/test/render-employee-app';

describe('HelpPage', () => {
  it('filters articles and opens People Ops email', async () => {
    renderEmployeeApp('/help');

    expect(screen.getByRole('heading', { name: 'Help' })).toBeInTheDocument();
    expect(screen.getByText('Punch in and out')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Search'), 'closed');

    expect(screen.getByText('Closed days vs leave')).toBeInTheDocument();
    expect(screen.queryByText('Punch in and out')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      'mailto:people@acmeconsulting.test',
    );
  });
});
