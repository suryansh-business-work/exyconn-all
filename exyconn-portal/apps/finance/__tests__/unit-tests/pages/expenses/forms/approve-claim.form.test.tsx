import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseStatus } from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';
import { ApproveClaimForm } from '../../../../../src/pages/expenses/forms/approve-claim';
import { claimRow } from '../../../fixtures';
import { renderForm } from '../../../form-helpers';

const gql = vi.hoisted(() => ({ setStatus: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSetExpenseClaimStatusMutation: () => [gql.setStatus],
}));

const amountField = () => screen.getByLabelText('Approved amount');

async function approve(amount: string) {
  fireEvent.change(amountField(), { target: { value: amount } });
  await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
}

describe('ApproveClaimForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.setStatus.mockResolvedValue({ data: { setExpenseClaimStatus: { id: 'claim-1' } } });
  });

  it('describes the claim and starts at the full amount claimed', () => {
    renderForm(<ApproveClaimForm claim={claimRow()} onDone={vi.fn()} onCancel={vi.fn()} />);

    expect(
      screen.getByText(`Client visit cab — ${formatMoney(1200, 'INR')} claimed.`),
    ).toBeInTheDocument();
    expect(amountField()).toHaveValue(1200);
    expect(screen.getByText('Defaults to the amount claimed')).toBeInTheDocument();
  });

  it('starts from the amount already approved when there is one', () => {
    renderForm(
      <ApproveClaimForm
        claim={claimRow({ approvedAmount: 700 })}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(amountField()).toHaveValue(700);
  });

  it('approves the claim for less than was asked, and says for how much', async () => {
    const onDone = vi.fn();
    renderForm(
      <ApproveClaimForm claim={claimRow({ id: 'claim-5' })} onDone={onDone} onCancel={vi.fn()} />,
    );

    await approve('1000');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.setStatus).toHaveBeenCalledWith({
      variables: { id: 'claim-5', status: ExpenseStatus.Approved, approvedAmount: 1000 },
    });
    expect(
      await screen.findByText(`Claim approved for ${formatMoney(1000, 'INR')}`),
    ).toBeInTheDocument();
  });

  it('accepts exactly the amount claimed, and nothing above it', async () => {
    renderForm(<ApproveClaimForm claim={claimRow()} onDone={vi.fn()} onCancel={vi.fn()} />);

    await approve('1201');
    expect(await screen.findByText('Cannot exceed the 1200 claimed')).toBeInTheDocument();
    expect(gql.setStatus).not.toHaveBeenCalled();

    await approve('1200');
    await waitFor(() => expect(gql.setStatus).toHaveBeenCalledTimes(1));
  });

  it('refuses a negative amount', async () => {
    renderForm(<ApproveClaimForm claim={claimRow()} onDone={vi.fn()} onCancel={vi.fn()} />);

    await approve('-5');

    expect(await screen.findByText('Must be ≥ 0')).toBeInTheDocument();
  });

  it('says why an approval failed, or that it could not be made', async () => {
    const onDone = vi.fn();
    gql.setStatus.mockRejectedValueOnce(new Error('Claim was withdrawn'));
    renderForm(<ApproveClaimForm claim={claimRow()} onDone={onDone} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(await screen.findByText('Claim was withdrawn')).toBeInTheDocument();

    gql.setStatus.mockRejectedValueOnce('offline');
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(await screen.findByText('Could not approve the claim')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on cancel', async () => {
    const onCancel = vi.fn();
    renderForm(<ApproveClaimForm claim={claimRow()} onDone={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
