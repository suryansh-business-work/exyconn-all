import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  BankAccountType,
  DeleteEmployeePayoutAccountDocument,
  PayoutMethod,
  SaveEmployeePayoutAccountDocument,
  EmployeePayoutAccountsDocument,
  EmployeePayoutSecretDocument,
  PayoutSecretField,
} from '@/graphql/generated';
import { EmployeePayoutPanel } from '@/pages/UserDetails/EmployeePayoutPanel';
import { usePermissions } from '@/hooks/usePermissions';
import { renderWithProviders } from '../../test-utils';
import { answer } from '../../mockResult';
import { bankAccount } from '../../components/payout/payoutFixtures';

vi.mock('@/hooks/usePermissions', () => ({ usePermissions: vi.fn() }));

const allow = (granted: Record<string, boolean>) =>
  vi.mocked(usePermissions).mockReturnValue({
    can: (_module: string, action: string) => granted[action] ?? false,
    loading: false,
  });

const listed = (uses = 3) =>
  answer(
    EmployeePayoutAccountsDocument,
    { employeePayoutAccounts: [bankAccount()] },
    { employeeId: 'e1' },
    uses,
  ).mock;

function show(mocks: Parameters<typeof renderWithProviders>[1]['mocks']) {
  renderWithProviders(<EmployeePayoutPanel employeeId="e1" country="IN" />, { mocks });
  return userEvent.setup();
}

beforeEach(() => {
  vi.mocked(usePermissions).mockReset();
});

describe('EmployeePayoutPanel', () => {
  it('is not shown to someone who may not see salaries', () => {
    allow({});
    show([]);
    expect(screen.queryByText('Salary accounts')).toBeNull();
  });

  it('lists the accounts read-only for someone who may only view', async () => {
    allow({ view: true });
    show([listed()]);

    expect(await screen.findByText('HDFC0001234 · •••• 6789')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add account' })).toBeNull();
  });

  it('fetches a full account number on request, never from the cache', async () => {
    allow({ view: true, edit: true });
    const secret = answer(
      EmployeePayoutSecretDocument,
      { employeePayoutSecret: '50100123456789' },
      { employeeId: 'e1', id: 'pa1', field: PayoutSecretField.AccountNumber },
    );
    const user = show([listed(), secret.mock]);

    const row = (await screen.findByText('HDFC0001234 · •••• 6789')).closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'view details' }));
    await user.click(await screen.findByRole('button', { name: 'Show Account number' }));

    expect(await screen.findByText('50100123456789')).toBeInTheDocument();
  });

  it('saves a new salary account against the employee', async () => {
    allow({ view: true, edit: true });
    const input = {
      method: PayoutMethod.Upi,
      country: 'IN',
      currency: 'INR',
      holderName: 'Ravi Kumar',
      bankName: '',
      branchName: '',
      accountNumber: '',
      iban: '',
      bic: '',
      routingCode: '',
      accountType: null,
      upiId: 'ravi@okhdfcbank',
      phone: '',
      walletEmail: '',
      city: '',
      region: '',
      isPrimary: false,
    };
    const saved = answer(
      SaveEmployeePayoutAccountDocument,
      { saveEmployeePayoutAccount: bankAccount({ accountType: BankAccountType.Savings }) },
      { employeeId: 'e1', id: null, input },
    );
    const user = show([listed(4), saved.mock]);

    await user.click(await screen.findByRole('button', { name: 'Add account' }));
    await user.click(screen.getByRole('combobox', { name: /^Payment method/ }));
    await user.click(await screen.findByRole('option', { name: 'UPI' }));
    await user.type(await screen.findByLabelText(/^Name on the UPI account/), 'Ravi Kumar');
    await user.type(screen.getByLabelText(/^UPI ID/), 'ravi@okhdfcbank');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(saved.delivered()).toBe(true));
    expect(await screen.findByText('Account added')).toBeInTheDocument();
  });

  it('removes an account for HR and re-reads the list', async () => {
    allow({ view: true, edit: true });
    const removed = answer(
      DeleteEmployeePayoutAccountDocument,
      { deleteEmployeePayoutAccount: true },
      { employeeId: 'e1', id: 'pa1' },
    );
    const user = show([listed(4), removed.mock]);

    const row = (await screen.findByText('HDFC0001234 · •••• 6789')).closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'remove' }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(removed.delivered()).toBe(true));
    expect(await screen.findByText('Account removed')).toBeInTheDocument();
  });
});
