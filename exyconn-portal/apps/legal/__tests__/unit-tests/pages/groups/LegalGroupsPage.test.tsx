import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import {
  CreateLegalGroupDocument,
  DeleteLegalGroupDocument,
  LegalAssignablesDocument,
  LegalItemKind,
  ListLegalGroupsDocument,
  UpdateLegalGroupDocument,
} from '@exyconn/shell/graphql/generated';
import { LegalGroupsPage } from '../../../../src/pages/groups';
import { renderWithProviders } from '../../test-utils';

const group = (id: string, name: string, kind: LegalItemKind, description = '') => ({
  __typename: 'LegalGroup',
  id,
  name,
  kind,
  description,
});
const item = (id: string, kind: LegalItemKind, title: string, groupId: string | null) => ({
  __typename: 'LegalAssignable',
  id,
  kind,
  title,
  status: 'ACTIVE',
  groupId,
  groupName: null,
});

const PART_TIME = group(
  'g1',
  'Part Time Employee Contracts',
  LegalItemKind.Contract,
  'For part-timers',
);
const GROUPS = [PART_TIME, group('g2', 'IT policies', LegalItemKind.Policy)];
const ITEMS = [
  ...Array.from({ length: 8 }, (_, i) =>
    item(`c${i}`, LegalItemKind.Contract, `Part-time contract ${i}`, 'g1'),
  ),
  item('p1', LegalItemKind.Policy, 'Device policy', 'g2'),
  item('c9', LegalItemKind.Contract, 'Loose contract', null),
];

const answer = (
  query: MockLink.MockedResponse['request']['query'],
  data: object,
  variables?: object,
) => ({
  request: { query, variables },
  result: { data },
  maxUsageCount: 5,
});
const groupsMock = (rows = GROUPS) => answer(ListLegalGroupsDocument, { listLegalGroups: rows });
const itemsMock = answer(LegalAssignablesDocument, { legalAssignables: ITEMS });

function show(mocks: MockLink.MockedResponse[], tab = 'contracts') {
  renderWithProviders(<LegalGroupsPage />, {
    mocks,
    route: `/legal/groups/${tab}`,
    path: '/legal/groups/:tab?',
  });
}

describe('LegalGroupsPage', () => {
  it('shows each contract group with what is in it, and only contract groups', async () => {
    show([groupsMock(), itemsMock]);

    expect(await screen.findByText('Part Time Employee Contracts')).toBeInTheDocument();
    expect(screen.getByText('For part-timers')).toBeInTheDocument();
    expect(await screen.findByText('8 items in use')).toBeInTheDocument();
    expect(screen.getByText('Part-time contract 0')).toBeInTheDocument();
    expect(screen.getByText('and 2 more')).toBeInTheDocument();
    expect(screen.queryByText('IT policies')).not.toBeInTheDocument();
  });

  it('says when a register has no groups yet', async () => {
    show([groupsMock(), itemsMock], 'documents');

    expect(await screen.findByText('No documents groups yet')).toBeInTheDocument();
  });

  it('adds a group to the register on screen', async () => {
    const created = answer(
      CreateLegalGroupDocument,
      { createLegalGroup: group('g3', 'Interns', LegalItemKind.Contract) },
      { input: { name: 'Interns', description: '', kind: 'CONTRACT' } },
    );
    show([groupsMock(), itemsMock, created]);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Add group' }));
    await user.type(await screen.findByRole('textbox', { name: /^Name/ }), 'Interns');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Group created')).toBeInTheDocument();
  });

  it('renames a group, keeping its kind', async () => {
    const updated = answer(
      UpdateLegalGroupDocument,
      { updateLegalGroup: { ...PART_TIME, name: 'Part-timers' } },
      {
        id: 'g1',
        input: { name: 'Part-timers', description: 'For part-timers', kind: 'CONTRACT' },
      },
    );
    show([groupsMock(), itemsMock, updated]);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Edit group' }));
    const name = await screen.findByRole('textbox', { name: /^Name/ });
    await user.clear(name);
    await user.type(name, 'Part-timers');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Group updated')).toBeInTheDocument();
  });

  it('deletes a group only once confirmed', async () => {
    const deleted = answer(DeleteLegalGroupDocument, { deleteLegalGroup: true }, { id: 'g1' });
    show([groupsMock(), itemsMock, deleted]);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Delete group' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Delete group' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Group deleted')).toBeInTheDocument();
  });

  it('says why a group could not be deleted', async () => {
    show([
      groupsMock(),
      itemsMock,
      {
        request: { query: DeleteLegalGroupDocument, variables: { id: 'g1' } },
        error: new Error('Busy'),
      },
    ]);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Delete group' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(await screen.findByText('Busy')).toBeInTheDocument();
  });

  it('says why the groups could not be read, and closes the form on cancel', async () => {
    show([{ request: { query: ListLegalGroupsDocument }, error: new Error('Offline') }, itemsMock]);
    const user = userEvent.setup();

    expect(await screen.findByText('Offline')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add group' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: /^Name/ })).not.toBeInTheDocument(),
    );
  });
});
