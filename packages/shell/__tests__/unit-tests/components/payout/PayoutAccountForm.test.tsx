import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayoutMethod, PayoutSecretField } from '@/graphql/generated';
import { PayoutAccountForm, type PayoutAccountApi } from '@/components/payout';
import { renderWithProviders } from '../../test-utils';
import { bankAccount } from './payoutFixtures';

const label = (text: string) => new RegExp(`^${text}\\s*\\*?$`);

function renderForm(
  initial: Parameters<typeof PayoutAccountForm>[0]['initial'] = null,
  api: Partial<PayoutAccountApi> = {},
) {
  const save = vi.fn().mockResolvedValue(undefined);
  const reveal = vi.fn().mockResolvedValue('50100123456789');
  const onDone = vi.fn();
  renderWithProviders(
    <PayoutAccountForm
      initial={initial}
      methods={['BANK_TRANSFER', 'UPI']}
      defaultCountry="IN"
      defaultCurrency="INR"
      api={{ save, reveal, ...api }}
      onDone={onDone}
      onCancel={vi.fn()}
    />,
  );
  return { save, reveal, onDone, user: userEvent.setup() };
}

async function fillIndianBank(user: ReturnType<typeof userEvent.setup>, ifsc: string) {
  await user.type(screen.getByLabelText(label('Account holder name')), 'Ravi Kumar');
  await user.type(screen.getByLabelText(label('Bank name')), 'HDFC Bank');
  await user.type(screen.getByLabelText(label('Account number')), '50100123456789');
  await user.type(screen.getByLabelText(label('IFSC')), ifsc);
}

describe('PayoutAccountForm', () => {
  it('saves an Indian bank account by its IFSC and account number', async () => {
    const { save, onDone, user } = renderForm();

    await fillIndianBank(user, 'hdfc0001234');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(save).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        method: PayoutMethod.BankTransfer,
        country: 'IN',
        currency: 'INR',
        accountNumber: '50100123456789',
        routingCode: 'hdfc0001234',
        isPrimary: false,
      }),
    );
    expect(await screen.findByText('Account added')).toBeInTheDocument();
  });

  it('refuses an IFSC whose fifth character is not 0', async () => {
    const { save, user } = renderForm();

    await fillIndianBank(user, 'HDFC1001234');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('This bank or branch code is not valid. Check it for typos.'),
    ).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it('asks UPI for a UPI ID or linked mobile, in India and rupees', async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole('combobox', { name: label('Payment method') }));
    await user.click(await screen.findByRole('option', { name: 'UPI' }));

    expect(await screen.findByLabelText(label('UPI ID'))).toBeInTheDocument();
    expect(screen.getByLabelText(label('UPI-linked mobile'))).toBeInTheDocument();
    expect(screen.queryByLabelText(label('IFSC'))).toBeNull();
  });

  it('keeps a stored account number when it is left blank, and shows it on the eye', async () => {
    const { save, reveal, onDone, user } = renderForm(bankAccount());

    expect(
      screen.getByText('Saved. Use the eye to see it, or type a new one to replace it.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show Account number' }));
    expect(reveal).toHaveBeenCalledWith(bankAccount(), PayoutSecretField.AccountNumber);
    expect(await screen.findByDisplayValue('50100123456789')).toBeInTheDocument();

    await user.clear(screen.getByLabelText(label('Account number')));
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(save).toHaveBeenCalledWith('pa1', expect.objectContaining({ accountNumber: '' }));
    expect(await screen.findByText('Account updated')).toBeInTheDocument();
  });

  it('says why a save failed and stays open', async () => {
    const { onDone, user } = renderForm(null, {
      save: vi
        .fn()
        .mockRejectedValue(new Error('You cannot change the salary account for yourself.')),
    });

    await fillIndianBank(user, 'HDFC0001234');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('You cannot change the salary account for yourself.'),
    ).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
