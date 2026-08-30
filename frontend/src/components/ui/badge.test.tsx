import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';

describe('Badge', () => {
  it('renders the status labels from the design system', () => {
    render(
      <>
        <Badge variant="present">In</Badge>
        <Badge variant="late">Late</Badge>
        <Badge variant="pending">Pending</Badge>
        <Badge variant="rejected">Rejected</Badge>
        <Badge variant="off">Off</Badge>
      </>,
    );

    expect(screen.getByText('In')).toBeInTheDocument();
    expect(screen.getByText('Late')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Off')).toBeInTheDocument();
  });
});
