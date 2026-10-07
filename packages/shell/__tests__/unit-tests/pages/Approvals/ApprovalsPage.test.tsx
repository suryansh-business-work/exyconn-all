import { screen, waitFor, within } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  ApprovalDecision,
  DecideApprovalDocument,
  MyApprovalsDocument,
  MyPendingApprovalCountDocument,
} from '@/graphql/generated';
import { formatMoney } from '@/utils/money';
import { ApprovalsPage } from '@/pages/Approvals';
import { renderWithProviders } from '../../test-utils';
import { answer } from '../../mockResult';
import { delegations } from './delegationFixtures';

function item(id: string, kind: string, kindLabel: string, amount: number | null = null) {
  return {
    __typename: 'ApprovalItem',
    id,
    kind,
    kindLabel,
    title: `${kindLabel} ${id}`,
    summary: `Summary of ${id}`,
    requestedById: 'emp-9',
    requestedByName: 'Meera Das',
    requestedAt: '2026-10-02T10:00:00.000Z',
    link: `/hr/${id}`,
    amount,
    currency: amount === null ? null : 'INR',
  };
}

const GROUPS = [
  { __typename: 'ApprovalGroup', kind: 'LEAVE', label: 'Leave request', count: 1 },
  { __typename: 'ApprovalGroup', kind: 'CLAIM', label: 'Expense claim', count: 1 },
];

function queue(kind: string | null, items: ReturnType<typeof item>[], totalCount = items.length) {
  return answer(
    MyApprovalsDocument,
    { myApprovals: { __typename: 'ApprovalQueue', totalCount, groups: GROUPS, items } },
    { kind },
  );
}

const leave = item('a1', 'LEAVE', 'Leave request');
const claim = item('a2', 'CLAIM', 'Expense claim', 1200);

function showPage(mocks: MockLink.MockedResponse[] = []) {
  renderWithProviders(<ApprovalsPage />, { mocks: [delegations().mock, ...mocks] });
}

const chip = (name: string) => screen.getByRole('button', { name });

describe('my approvals', () => {
  it('says nothing is waiting when the queue is empty', async () => {
    showPage([answer(MyApprovalsDocument, { myApprovals: null }, { kind: null }).mock]);

    expect(await screen.findByText('You are all caught up.')).toBeInTheDocument();
    expect(screen.getByText('Nothing is waiting on you')).toBeInTheDocument();
    expect(chip('All (0)')).toBeInTheDocument();
  });

  it('lists every decision with what is at stake', async () => {
    showPage([queue(null, [leave, claim]).mock]);

    expect(await screen.findByText('Leave request a1')).toBeInTheDocument();
    expect(screen.getByText('2 waiting on you')).toBeInTheDocument();
    expect(screen.getByText('Summary of a2')).toBeInTheDocument();
    expect(screen.getAllByText('Meera Das')).toHaveLength(2);
    expect(screen.getByText(formatMoney(1200, 'INR'))).toBeInTheDocument();
    // A decision about no money says so.
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('narrows the queue on the server by kind, and widens it again', async () => {
    const user = userEvent.setup();
    const narrowed = queue('LEAVE', [leave], 2);
    showPage([queue(null, [leave, claim]).mock, narrowed.mock, queue(null, [leave, claim]).mock]);
    await screen.findByText('Expense claim a2');
    expect(chip('All (2)')).toHaveClass('MuiChip-filled');
    expect(chip('Leave request (1)')).toHaveClass('MuiChip-outlined');

    await user.click(chip('Leave request (1)'));

    await waitFor(() => expect(screen.queryByText('Expense claim a2')).not.toBeInTheDocument());
    expect(narrowed.delivered()).toBe(true);
    expect(chip('Leave request (1)')).toHaveClass('MuiChip-filled');
    expect(chip('All (2)')).toHaveClass('MuiChip-outlined');

    await user.click(chip('All (2)'));

    expect(await screen.findByText('Expense claim a2')).toBeInTheDocument();
    expect(chip('All (2)')).toHaveClass('MuiChip-filled');
  });

  it('approves a decision once confirmed', async () => {
    const user = userEvent.setup();
    const decided = answer(
      DecideApprovalDocument,
      { decideApproval: true },
      { id: 'a1', decision: ApprovalDecision.Approved },
    );
    showPage([
      queue(null, [leave]).mock,
      decided.mock,
      answer(MyPendingApprovalCountDocument, { myPendingApprovalCount: 0 }).mock,
      queue(null, []).mock,
    ]);
    const row = (await screen.findByText('Leave request a1')).closest('tr')!;

    await user.click(within(row).getByRole('button', { name: 'Approve' }));
    expect(await screen.findByText('Approve this leave request?')).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Approve' }));

    expect(await screen.findByText('Leave request approved')).toBeInTheDocument();
    expect(decided.delivered()).toBe(true);
  });

  it('asks before rejecting, and does nothing when the answer is no', async () => {
    const user = userEvent.setup();
    showPage([queue(null, [claim]).mock]);
    const row = (await screen.findByText('Expense claim a2')).closest('tr')!;

    await user.click(within(row).getByRole('button', { name: 'Reject' }));
    expect(await screen.findByText('Reject this expense claim?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Expense claim a2')).toBeInTheDocument();
  });
});
