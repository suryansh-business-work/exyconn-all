import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AssignLegalItemsDocument,
  EmployeeLegalAssignmentsDocument,
  LegalAssignablesDocument,
  LegalItemKind,
  UnassignLegalItemDocument,
} from '@/graphql/generated';
import { EmployeeLegalPanel } from '@/pages/UserDetails/EmployeeLegalPanel';
import { renderWithProviders } from '../../test-utils';
import { answer, failure } from '../../mockResult';
import { PART_TIME, assignable, assignment } from '../../components/legal/legalFixtures';

const HELD = [
  assignment('a1', 'c3', 'Old NDA'),
  assignment('a2', 'p2', 'Leave policy', {
    kind: LegalItemKind.Policy,
    groupName: 'HR policies',
  }),
];
const ASSIGNABLES = [
  assignable('c1', LegalItemKind.Contract, 'Part-time offer', PART_TIME),
  assignable('c2', LegalItemKind.Contract, 'Part-time NDA', PART_TIME),
  assignable('p1', LegalItemKind.Policy, 'Code of conduct'),
  // A group whose name could not be read is listed, but cannot be added as a whole.
  { ...assignable('d1', LegalItemKind.Document, 'Handbook'), groupId: 'gone' },
  assignable('c3', LegalItemKind.Contract, 'Old NDA'),
];

const heldAnswer = (rows = HELD) =>
  answer(EmployeeLegalAssignmentsDocument, { employeeLegalAssignments: rows }, { userId: 'e1' }, 5)
    .mock;
const assignablesAnswer = (rows: unknown[] = ASSIGNABLES) =>
  answer(LegalAssignablesDocument, { legalAssignables: rows }, undefined, 3).mock;
const PART_TIME_ITEMS = [
  { kind: 'CONTRACT', itemId: 'c1' },
  { kind: 'CONTRACT', itemId: 'c2' },
];

function show(mocks: Parameters<typeof renderWithProviders>[1]['mocks']) {
  renderWithProviders(<EmployeeLegalPanel employeeId="e1" />, { mocks });
}

async function openAssign() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Assign' }));
  return user;
}

describe('EmployeeLegalPanel', () => {
  it('lists what the employee holds, with type, group and who handed it over', async () => {
    show([heldAnswer()]);

    expect(await screen.findByText('Old NDA')).toBeInTheDocument();
    expect(screen.getByText('Leave policy')).toBeInTheDocument();
    expect(screen.getByText('HR policies')).toBeInTheDocument();
    expect(screen.getAllByText('Hema HR')).toHaveLength(2);
  });

  it('says why the list could not be read', async () => {
    show([failure(EmployeeLegalAssignmentsDocument, { userId: 'e1' })]);

    expect(await screen.findByText('The network is down')).toBeInTheDocument();
  });

  it('assigns a whole group, leaving out what the employee already holds', async () => {
    const assigned = answer(
      AssignLegalItemsDocument,
      { assignLegalItems: [] },
      { userId: 'e1', items: PART_TIME_ITEMS },
    );
    show([heldAnswer(), assignablesAnswer(), assigned.mock]);
    const user = await openAssign();

    await user.click(await screen.findByRole('combobox', { name: 'Add a whole group' }));
    await user.click(
      await screen.findByRole('option', { name: 'Part Time Employee Contracts (2 items)' }),
    );
    expect(screen.getByRole('button', { name: 'Part-time offer' })).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: /Contracts, policies and documents/ }));
    const list = await screen.findByRole('listbox');
    expect(within(list).getByText('Policies')).toBeInTheDocument();
    expect(within(list).queryByRole('option', { name: 'Old NDA' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Assign' }));

    expect(
      await screen.findByText('Assigned — the employee sees them on their profile'),
    ).toBeInTheDocument();
    expect(assigned.delivered()).toBe(true);
  });

  it('picks single items and says why an assignment failed', async () => {
    show([
      heldAnswer(),
      assignablesAnswer(),
      failure(AssignLegalItemsDocument, {
        userId: 'e1',
        items: [{ kind: 'POLICY', itemId: 'p1' }],
      }),
    ]);
    const user = await openAssign();

    await user.click(
      await screen.findByRole('combobox', { name: /Contracts, policies and documents/ }),
    );
    await user.click(await screen.findByRole('option', { name: 'Code of conduct' }));
    await user.click(screen.getAllByRole('button', { name: 'Assign' }).at(-1)!);

    expect(await screen.findByText('The network is down')).toBeInTheDocument();
  });

  it('asks for at least one item, and offers no group shortcut without groups', async () => {
    show([
      heldAnswer(),
      assignablesAnswer([assignable('p1', LegalItemKind.Policy, 'Code of conduct')]),
    ]);
    const user = await openAssign();

    await screen.findByRole('combobox', { name: /Contracts, policies and documents/ });
    expect(screen.queryByRole('combobox', { name: 'Add a whole group' })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Assign' }).at(-1)!);

    expect(
      await screen.findByText('Choose at least one contract, policy or document'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument(),
    );
  });

  it('says why the items to assign could not be read, and closes', async () => {
    show([heldAnswer(), failure(LegalAssignablesDocument)]);
    const user = await openAssign();

    expect(await screen.findByText('The network is down')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
  });

  it('takes an item back only once confirmed, and says so', async () => {
    const takenBack = answer(UnassignLegalItemDocument, { unassignLegalItem: true }, { id: 'a1' });
    show([heldAnswer(), takenBack.mock]);
    const user = userEvent.setup();
    const [first] = await screen.findAllByRole('button', { name: 'take back' });

    await user.click(first);
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(takenBack.delivered()).toBe(false);

    await user.click(first);
    await user.click(await screen.findByRole('button', { name: 'Take back' }));
    expect(await screen.findByText('Taken back')).toBeInTheDocument();
  });

  it('says why an item could not be taken back', async () => {
    show([heldAnswer(), failure(UnassignLegalItemDocument, { id: 'a1' })]);
    const user = userEvent.setup();
    const [first] = await screen.findAllByRole('button', { name: 'take back' });

    await user.click(first);
    await user.click(await screen.findByRole('button', { name: 'Take back' }));

    expect(await screen.findByText('The network is down')).toBeInTheDocument();
  });
});
