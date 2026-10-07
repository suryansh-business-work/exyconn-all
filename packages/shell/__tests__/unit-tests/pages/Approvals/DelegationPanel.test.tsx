import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { describe, expect, it } from 'vitest';
import {
  DelegateApprovalsDocument,
  EndApprovalDelegationDocument,
  ListEmployeeOptionsDocument,
  MyApprovalDelegationsDocument,
} from '@/graphql/generated';
import { DelegationPanel } from '@/pages/Approvals';
import { renderWithProviders } from '../../test-utils';
import { answer, failure } from '../../mockResult';
import { delegations, given, held } from './delegationFixtures';

const people = answer(ListEmployeeOptionsDocument, { listEmployeeOptions: [] });

const RAVI = {
  __typename: 'EmployeeOption',
  id: 'emp-g9',
  name: 'Ravi Kumar',
  email: 'ravi@example.com',
  designation: null,
  department: null,
};

const localIso = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day).toISOString();

const field = (name: string) => document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;

function showPanel(mocks: MockLink.MockedResponse[]) {
  renderWithProviders(<DelegationPanel />, { mocks });
}

describe('the delegation panel', () => {
  it('shows a loading state until the arrangements arrive', async () => {
    showPanel([delegations().mock]);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Nobody is covering your approvals, and you are not covering anybody.',
      ),
    ).toBeInTheDocument();
  });

  it('shows an empty panel when the arrangements cannot be read', async () => {
    showPanel([failure(MyApprovalDelegationsDocument)]);

    expect(
      await screen.findByText(
        'Nobody is covering your approvals, and you are not covering anybody.',
      ),
    ).toBeInTheDocument();
  });

  it('lists both sides, marking what is live now and any note', async () => {
    showPanel([
      delegations(
        [given('g1', 'Ravi Kumar', true, 'Annual leave'), given('g2', 'Meera Das', false)],
        [held('h1', 'Arjun Mehta', false)],
      ).mock,
    ]);

    expect(await screen.findByText('Ravi Kumar covers you')).toBeInTheDocument();
    expect(screen.getByText('Meera Das covers you')).toBeInTheDocument();
    expect(screen.getByText('You cover Arjun Mehta')).toBeInTheDocument();
    expect(screen.getAllByText('Now')).toHaveLength(1);
    expect(screen.getByText(/· Annual leave$/)).toBeInTheDocument();
    // Only cover you gave can be ended from here.
    expect(screen.getAllByRole('button', { name: 'End' })).toHaveLength(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('explains somebody else’s work in the queue while you cover them', async () => {
    showPanel([delegations([], [held('h1', 'Arjun Mehta', true)]).mock]);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You are covering approvals for somebody else, shown in the queue above.',
    );
  });

  it('leaves the cover in place when ending it is not confirmed', async () => {
    const user = userEvent.setup();
    const end = answer(
      EndApprovalDelegationDocument,
      { endApprovalDelegation: true },
      { id: 'g1' },
    );
    showPanel([delegations([given('g1', 'Ravi Kumar', true)]).mock, end.mock]);

    await user.click(await screen.findByRole('button', { name: 'End' }));
    expect(
      await screen.findByText('Ravi Kumar stops seeing your approvals immediately.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(end.delivered()).toBe(false);
  });

  it('ends a cover once confirmed, reloads and says so', async () => {
    const user = userEvent.setup();
    const end = answer(
      EndApprovalDelegationDocument,
      { endApprovalDelegation: true },
      { id: 'g1' },
    );
    showPanel([delegations([given('g1', 'Ravi Kumar', true)]).mock, end.mock, delegations().mock]);

    await user.click(await screen.findByRole('button', { name: 'End' }));
    await user.click(await screen.findByRole('button', { name: 'End cover' }));

    expect(await screen.findByText('That cover has ended.')).toBeInTheDocument();
    expect(end.delivered()).toBe(true);
    expect(
      await screen.findByText(
        'Nobody is covering your approvals, and you are not covering anybody.',
      ),
    ).toBeInTheDocument();
  });

  it('says why a cover could not be ended', async () => {
    const user = userEvent.setup();
    showPanel([
      delegations([given('g1', 'Ravi Kumar', true)]).mock,
      failure(EndApprovalDelegationDocument, { id: 'g1' }, 'Already ended'),
    ]);

    await user.click(await screen.findByRole('button', { name: 'End' }));
    await user.click(await screen.findByRole('button', { name: 'End cover' }));

    expect(await screen.findByText('Already ended')).toBeInTheDocument();
    expect(screen.getByText('Ravi Kumar covers you')).toBeInTheDocument();
  });

  it('swaps the list for the form while arranging, and back on cancel', async () => {
    const user = userEvent.setup();
    showPanel([delegations().mock, people.mock]);

    await user.click(await screen.findByRole('button', { name: 'Arrange cover' }));
    expect(screen.getByLabelText(/Who covers you/)).toBeInTheDocument();
    expect(screen.queryByText(/Nobody is covering/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText(/Nobody is covering/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Who covers you/)).not.toBeInTheDocument();
  });

  it('goes back to the list, reloaded, once cover is arranged', async () => {
    const user = userEvent.setup();
    const span = { fromDate: localIso(2026, 6, 15), toDate: localIso(2026, 6, 30) };
    showPanel([
      delegations().mock,
      answer(ListEmployeeOptionsDocument, { listEmployeeOptions: [RAVI] }).mock,
      answer(
        DelegateApprovalsDocument,
        {
          delegateApprovals: {
            __typename: 'ApprovalDelegation',
            id: 'g9',
            toName: 'Ravi Kumar',
            active: true,
            ...span,
          },
        },
        { input: { toEmployeeId: RAVI.id, note: null, ...span } },
      ).mock,
      delegations([given('g9', 'Ravi Kumar', true)]).mock,
    ]);

    await user.click(await screen.findByRole('button', { name: 'Arrange cover' }));
    await user.type(field('toEmployeeId'), 'Ravi');
    await user.click(await screen.findByRole('option', { name: /Ravi Kumar/ }));
    fireEvent.change(field('fromDate'), { target: { value: '06/15/2026' } });
    fireEvent.change(field('toDate'), { target: { value: '06/30/2026' } });
    await user.click(screen.getByRole('button', { name: 'Arrange cover' }));

    expect(await screen.findByText('Ravi Kumar covers you')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Who covers you/)).not.toBeInTheDocument();
  });
});
