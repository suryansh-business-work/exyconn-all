import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadFilters } from '../../../../src/pages/lead-generator/LeadFilters';
import { renderWithProviders } from '../../test-utils';

function renderFilters(overrides: Partial<Parameters<typeof LeadFilters>[0]> = {}) {
  const props = {
    shown: 3,
    total: 5,
    hasPhone: false,
    hasEmail: false,
    needsLookup: false,
    onTogglePhone: vi.fn(),
    onToggleEmail: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<LeadFilters {...props} />);
  return props;
}

describe('LeadFilters', () => {
  it('shows how many results pass the filters', () => {
    renderFilters();

    expect(screen.getByRole('status')).toHaveTextContent('Showing 3 of 5');
  });

  it('announces each filter as a pressed or unpressed button and toggles it on click', async () => {
    const props = renderFilters({ hasPhone: true });

    const phone = screen.getByRole('button', { name: 'Has phone' });
    const email = screen.getByRole('button', { name: 'Has email' });
    expect(phone).toHaveAttribute('aria-pressed', 'true');
    expect(email).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(phone);
    await userEvent.click(email);
    expect(props.onTogglePhone).toHaveBeenCalledTimes(1);
    expect(props.onToggleEmail).toHaveBeenCalledTimes(1);
  });

  it('hints to find emails first only when the email filter would hide unread sites', () => {
    renderFilters({ hasEmail: true, needsLookup: true });
    expect(screen.getByText('Find emails first to filter by email')).toBeInTheDocument();
  });

  it('does not hint while every website was read', () => {
    renderFilters({ hasEmail: true });
    expect(screen.queryByText('Find emails first to filter by email')).not.toBeInTheDocument();
  });
});
