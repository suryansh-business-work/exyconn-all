import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialNetwork } from '@exyconn/shell/graphql/generated';
import { AccountFilter } from '../../../../../src/pages/social/CalendarTab/AccountFilter';
import { renderWithProviders } from '../../../test-utils';
import { accountRow } from '../../../fixtures';

const ACCOUNTS = [
  accountRow(),
  accountRow({ id: 'li-1', name: 'Acme', network: SocialNetwork.Linkedin }),
];

function renderFilter(selected: string[], loading = false) {
  const onChange = vi.fn();
  renderWithProviders(
    <AccountFilter accounts={ACCOUNTS} selected={selected} loading={loading} onChange={onChange} />,
  );
  return onChange;
}

describe('AccountFilter', () => {
  it('shows a spinner until the accounts arrive', () => {
    renderFilter([], true);

    expect(screen.getByRole('progressbar', { name: 'Loading accounts' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('reads as all accounts while none is chosen', () => {
    renderFilter([]);

    expect(screen.getByRole('combobox', { name: 'Accounts' })).toHaveAttribute(
      'placeholder',
      'All accounts',
    );
  });

  it('shows the chosen accounts as chips, ignoring ids it does not know', () => {
    renderFilter(['li-1', 'gone']);

    expect(screen.getByRole('button', { name: 'Acme · LinkedIn' })).toBeInTheDocument();
    expect(screen.queryByText('Acme · Facebook')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Accounts' })).not.toHaveAttribute('placeholder');
  });

  it('adds an account picked from the list', async () => {
    const onChange = renderFilter(['li-1']);

    await userEvent.click(screen.getByRole('combobox', { name: 'Accounts' }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Acme · Facebook' }),
    );

    expect(onChange).toHaveBeenCalledWith(['li-1', 'fb-1']);
  });

  it('drops an account whose chip is removed', async () => {
    const onChange = renderFilter(['fb-1', 'li-1']);
    const chip = screen.getByRole('button', { name: 'Acme · Facebook' });

    await userEvent.click(within(chip).getByTestId('CancelIcon'));

    expect(onChange).toHaveBeenCalledWith(['li-1']);
  });
});
