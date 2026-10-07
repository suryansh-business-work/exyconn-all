import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@exyconn/i18n';
import { useCreateMyExpenseClaimMutation } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { localIso, mutationTuple, pickerInput } from '../../apolloHookMocks';
import { ExpenseClaimForm } from '../../../../../../src/pages/employee/forms/expense-claim';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateMyExpenseClaimMutation: vi.fn(),
}));

const NO_MESSAGES = {};
const COMPANY = { currency: 'INR' };
const createClaim = vi.fn();

/** Renders the form, inside the company's settings unless `withCurrency` is false. */
function setup(withCurrency = true) {
  const onCancel = vi.fn();
  const onDone = vi.fn();
  const form = <ExpenseClaimForm onCancel={onCancel} onDone={onDone} />;
  const ui: ReactElement = withCurrency ? (
    <I18nProvider locale="en" messages={NO_MESSAGES} settings={COMPANY}>
      {form}
    </I18nProvider>
  ) : (
    form
  );
  renderWithProviders(ui);
  return { onCancel, onDone };
}

async function fillValid(receipt = '') {
  await userEvent.type(screen.getByLabelText('Category'), 'Travel');
  await userEvent.type(screen.getByLabelText('Description'), 'Cab to the client site');
  await userEvent.clear(screen.getByLabelText('Amount'));
  await userEvent.type(screen.getByLabelText('Amount'), '1250');
  fireEvent.change(pickerInput('incurredOn'), { target: { value: '03/04/2026' } });
  if (receipt) {
    await userEvent.type(screen.getByLabelText('Receipt link (optional)'), receipt);
  }
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Submit claim' }));

beforeEach(() => {
  createClaim.mockReset();
  vi.mocked(useCreateMyExpenseClaimMutation).mockReturnValue(
    mutationTuple<typeof useCreateMyExpenseClaimMutation>(createClaim),
  );
});

describe('ExpenseClaimForm', () => {
  it('requires the claim details and a positive amount', async () => {
    setup();
    await submit();

    expect(await screen.findByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Must be more than 0')).toBeInTheDocument();
    expect(screen.getByText('Date is required')).toBeInTheDocument();
    expect(screen.queryByText('Currency is required')).toBeNull();
    expect(createClaim).not.toHaveBeenCalled();
  });

  it('requires a currency when the company has none set', async () => {
    setup(false);
    await submit();
    expect(await screen.findByText('Currency is required')).toBeInTheDocument();
  });

  it('rejects a receipt that is not a web link', async () => {
    setup();
    await fillValid('receipt.pdf');
    await submit();

    expect(await screen.findByText('Must be a valid link')).toBeInTheDocument();
    expect(createClaim).not.toHaveBeenCalled();
  });

  it('files the claim in the company currency with no receipt as null', async () => {
    createClaim.mockResolvedValue({ data: { createMyExpenseClaim: { id: 'claim-1' } } });
    const { onDone } = setup();
    await fillValid();
    await submit();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(createClaim).toHaveBeenCalledWith({
      variables: {
        input: {
          category: 'Travel',
          description: 'Cab to the client site',
          amount: 1250,
          currency: 'INR',
          incurredOn: localIso(2026, 2, 4),
          receiptUrl: null,
        },
      },
    });
    expect(await screen.findByText('Expense claim submitted')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toHaveValue('');
  });

  it('sends the receipt link when one is given', async () => {
    createClaim.mockResolvedValue({ data: { createMyExpenseClaim: { id: 'claim-2' } } });
    setup();
    await fillValid('https://drive.example.com/receipt.pdf');
    await submit();

    await waitFor(() => expect(createClaim).toHaveBeenCalledTimes(1));
    expect(createClaim.mock.calls[0][0].variables.input.receiptUrl).toBe(
      'https://drive.example.com/receipt.pdf',
    );
  });

  it('shows the server’s message when filing fails', async () => {
    createClaim.mockRejectedValue(new Error('Claims are closed for March'));
    const { onDone } = setup();
    await fillValid();
    await submit();

    expect(await screen.findByText('Claims are closed for March')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    createClaim.mockRejectedValue({ reason: 'unknown' });
    setup();
    await fillValid();
    await submit();

    expect(await screen.findByText('Could not submit the claim')).toBeInTheDocument();
  });

  it('cancels without filing', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
