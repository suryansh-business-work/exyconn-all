import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Chip } from '../../../../src/components/ui/Chip';
import { CHROME } from '../../../../src/theme/palette';
import { renderWithProviders } from '../../test-utils';

describe('Chip', () => {
  it('shows a quiet label with no icon by default', () => {
    renderWithProviders(<Chip label="Pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.queryByTestId(/^icon-/)).not.toBeInTheDocument();
  });

  it('draws its icon in the tone it was given', () => {
    renderWithProviders(<Chip label="Approved" tone="success" icon="check" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByTestId('icon-check')).toHaveAttribute('data-color', CHROME.light.success);
  });
});
