import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';

describe('Badge', () => {
  it('renders the status labels from the design system', () => {
    render(
      <>
        <Badge variant="present">Clocked in at 09:02</Badge>
        <Badge variant="present">Active</Badge>
        <Badge variant="late">Late</Badge>
        <Badge variant="off">Not clocked in</Badge>
        <Badge variant="pending">Pending</Badge>
        <Badge variant="rejected">Closed</Badge>
      </>,
    );

    expect(screen.getByText('Clocked in at 09:02')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Late')).toBeInTheDocument();
    expect(screen.getByText('Not clocked in')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });
});
