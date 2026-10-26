import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayoutSecretField } from '@/graphql/generated';
import { PayoutAccountsPanel, SALARY_METHODS, type PayoutAccountApi } from '@/components/payout';
import { renderWithProviders } from '../../test-utils';
import { bankAccount, upiAccount } from './payoutFixtures';

interface Options {
  editable?: boolean;
  onDelete?: () => Promise<unknown>;
  reveal?: PayoutAccountApi['reveal'];
  error?: string;
}

function renderPanel({ editable = true, onDelete, reveal, error }: Options = {}) {
  const api: PayoutAccountApi = {
    save: vi.fn().mockResolvedValue(undefined),
    reveal: reveal ?? vi.fn().mockResolvedValue('50100123456789'),
  };
  renderWithProviders(
    <PayoutAccountsPanel
      title="Salary accounts"
      description="Where salary is paid."
      rows={[bankAccount(), upiAccount()]}
      loading={false}
      error={error}
      onRefresh={vi.fn().mockResolvedValue(undefined)}
      methods={SALARY_METHODS}
      defaultCountry="IN"
      defaultCurrency="INR"
      api={api}
      editable={editable}
      onDelete={onDelete}
    />,
  );
  return { api, user: userEvent.setup() };
}

const rowOf = (text: string) => screen.getByText(text).closest('tr') as HTMLElement;

describe('PayoutAccountsPanel', () => {
  it('lists each account by method and masked summary, marking the default', () => {
    renderPanel();

    expect(screen.getByText('HDFC0001234 · •••• 6789')).toBeInTheDocument();
    expect(screen.getByText('ra••••@okhdfcbank')).toBeInTheDocument();
    expect(within(rowOf('HDFC0001234 · •••• 6789')).getByText('Default')).toBeInTheDocument();
    expect(within(rowOf('ra••••@okhdfcbank')).queryByText('Default')).toBeNull();
    expect(screen.getByText('Where salary is paid.')).toBeInTheDocument();
  });

  it('shows why the list could not be read', () => {
    renderPanel({ error: 'Forbidden' });
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('offers only View details when read-only', () => {
    renderPanel({ editable: false });

    expect(screen.queryByRole('button', { name: 'Add account' })).toBeNull();
    expect(screen.queryAllByRole('button', { name: 'edit' })).toHaveLength(0);
    expect(screen.getAllByRole('button', { name: 'view details' })).toHaveLength(2);
  });

  it('opens an account’s details and shows a sealed number on request', async () => {
    const reveal = vi.fn().mockResolvedValue('50100123456789');
    const { user } = renderPanel({ editable: false, reveal });

    await user.click(
      within(rowOf('HDFC0001234 · •••• 6789')).getByRole('button', { name: 'view details' }),
    );
    expect(await screen.findByText('Account details')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show Account number' }));

    expect(await screen.findByText('50100123456789')).toBeInTheDocument();
    expect(reveal).toHaveBeenCalledWith(bankAccount(), PayoutSecretField.AccountNumber);
  });

  it('opens the form to add an account, and to edit one', async () => {
    const { user } = renderPanel();

    await user.click(screen.getByRole('button', { name: 'Add account' }));
    expect(await screen.findByRole('button', { name: 'Create' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    const edit = await waitFor(() =>
      within(rowOf('ra••••@okhdfcbank')).getByRole('button', { name: 'edit' }),
    );
    await user.click(edit);
    expect(await screen.findByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('removes an account once confirmed', async () => {
    const onDelete = vi.fn().mockResolvedValue(true);
    const { user } = renderPanel({ onDelete });

    await user.click(within(rowOf('ra••••@okhdfcbank')).getByRole('button', { name: 'remove' }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(upiAccount()));
    expect(await screen.findByText('Account removed')).toBeInTheDocument();
  });

  it('leaves the account when the removal is cancelled', async () => {
    const onDelete = vi.fn();
    const { user } = renderPanel({ onDelete });

    await user.click(within(rowOf('ra••••@okhdfcbank')).getByRole('button', { name: 'remove' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('says why a removal failed', async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error('Not allowed'));
    const { user } = renderPanel({ onDelete });

    await user.click(within(rowOf('ra••••@okhdfcbank')).getByRole('button', { name: 'remove' }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
  });
});
