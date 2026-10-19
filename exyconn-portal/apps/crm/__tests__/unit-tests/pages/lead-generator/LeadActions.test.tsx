import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadActions } from '../../../../src/pages/lead-generator/LeadActions';
import { renderWithProviders } from '../../test-utils';

function renderActions(overrides: Partial<Parameters<typeof LeadActions>[0]> = {}) {
  const props = {
    total: 4,
    selected: 0,
    findingEmails: false,
    importing: false,
    onToggleAll: vi.fn(),
    onFindEmails: vi.fn(),
    onImport: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<LeadActions {...props} />);
  return props;
}

const selectAll = () => screen.getByRole('checkbox', { name: /selected$/ });

describe('LeadActions', () => {
  it('disables both actions while nothing is selected', () => {
    renderActions();

    expect(selectAll()).not.toBeChecked();
    expect(selectAll()).toHaveAttribute('data-indeterminate', 'false');
    expect(screen.getByRole('button', { name: 'Find emails' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add 0 to CRM' })).toBeDisabled();
  });

  it('shows a partial selection as indeterminate and runs the chosen actions', async () => {
    const props = renderActions({ selected: 2 });

    expect(screen.getByText('2 of 4 selected')).toBeInTheDocument();
    expect(selectAll()).toHaveAttribute('data-indeterminate', 'true');

    await userEvent.click(selectAll());
    await userEvent.click(screen.getByRole('button', { name: 'Find emails' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add 2 to CRM' }));

    expect(props.onToggleAll).toHaveBeenCalledTimes(1);
    expect(props.onFindEmails).toHaveBeenCalledTimes(1);
    expect(props.onImport).toHaveBeenCalledTimes(1);
  });

  it('ticks select-all when every row is selected', () => {
    renderActions({ selected: 4 });

    expect(selectAll()).toBeChecked();
    expect(selectAll()).toHaveAttribute('data-indeterminate', 'false');
  });

  it('shows progress and blocks repeats while reading websites or adding', () => {
    renderActions({ selected: 2, findingEmails: true, importing: true });

    expect(screen.getByRole('button', { name: 'Reading websites…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Adding…' })).toBeDisabled();
  });
});
