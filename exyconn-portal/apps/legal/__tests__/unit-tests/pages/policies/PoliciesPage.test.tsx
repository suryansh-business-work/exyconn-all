import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListPoliciesPagedDocument } from '@exyconn/shell/graphql/generated';
import { PolicyForm } from '@exyconn/shell/pages/content-forms';
import { PoliciesPage } from '../../../../src/pages/policies';
import { POLICY_COLUMNS, type PagedPolicyRow } from '../../../../src/pages/policies/policies-grid';
import { renderWithProviders } from '../../test-utils';
import {
  crud,
  dashboardProps,
  fetchRows,
  page,
  resetCrudPage,
  resourceOptions,
  statValues,
} from '../../crud-page.mocks';
import { formatDate } from '../../settings.mock';
import { tableStats } from '../legal/legal.fixtures';
import { policyRow } from './policy.fixtures';

interface SignersStubProps {
  policy: PagedPolicyRow | null;
  onClose: () => void;
}

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  remove: vi.fn(),
  refetch: vi.fn(),
  publish: vi.fn(),
  onPublished: null as null | (() => Promise<unknown> | void),
}));

vi.mock('@exyconn/crud', async () => (await import('../../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListPoliciesStatsQuery: gql.stats,
  useDeletePolicyMutation: () => [gql.remove],
}));
vi.mock('@exyconn/shell/pages/content-forms', () => ({
  PolicyForm: () => null,
  usePublishPolicy: (onPublished: () => Promise<unknown> | void) => {
    gql.onPublished = onPublished;
    return gql.publish;
  },
}));
vi.mock('../../../../src/pages/policies/PolicySignersDialog', () => ({
  PolicySignersDialog: ({ policy, onClose }: Readonly<SignersStubProps>) =>
    policy && (
      <div>
        <p>Signers of {policy.title}</p>
        <button type="button" onClick={onClose}>
          Done reading
        </button>
      </div>
    ),
}));

const ROW = policyRow();

const answerStats = (data: object | undefined, loading = false) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

describe('PoliciesPage', () => {
  beforeEach(() => {
    resetCrudPage();
    gql.remove.mockReset().mockResolvedValue({ data: { deletePolicy: true } });
    gql.refetch.mockReset().mockResolvedValue({ data: {} });
    gql.publish.mockReset();
    gql.onPublished = null;
    answerStats(undefined, true);
  });

  it('frames the policy register under the Policy permission', () => {
    renderWithProviders(<PoliciesPage />);
    expect(dashboardProps()).toMatchObject({
      title: 'Policies',
      subtitle: 'What the company asks of people, and who has agreed to it',
      entityLabel: 'policy',
      exportFileName: 'policies',
      permissionModule: 'Policy',
      searchPlaceholder: 'Search by title, slug or owner…',
      crud,
      fetchRows,
    });
    expect(dashboardProps().columnDefs).toBe(POLICY_COLUMNS);
    expect(dashboardProps().context.formatDate).toBe(formatDate);
  });

  it('shows placeholders until the stats first answer', () => {
    renderWithProviders(<PoliciesPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual({ Policies: '0', Published: '0', Drafts: '0', Public: '0' });
  });

  it('counts the policies by status and the public ones', () => {
    answerStats({
      listPoliciesStats: tableStats(10, {
        status: { PUBLISHED: 6, DRAFT: 3, ARCHIVED: 1 },
        audience: { PUBLIC: 2, ALL_STAFF: 8 },
      }),
    });
    renderWithProviders(<PoliciesPage />);
    expect(statValues()).toEqual({ Policies: '10', Published: '6', Drafts: '3', Public: '2' });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('deletes a policy by id, warning that its signatures go too', async () => {
    renderWithProviders(<PoliciesPage />);
    const options = resourceOptions();
    expect(options.label).toBe('Policy');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(ROW)).toEqual({
      message: 'Delete "{title}"? Signatures against it are deleted too.',
      values: { title: 'Acceptable use' },
    });
    await options.onDelete(ROW);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'policy-1' } });
  });

  it('reads its grid rows from the paged policies query', () => {
    renderWithProviders(<PoliciesPage />);
    const paged = { rows: [ROW], totalCount: 1 };
    expect(page.fetcher?.document).toBe(ListPoliciesPagedDocument);
    expect(page.fetcher?.select({ listPoliciesPaged: paged })).toBe(paged);
  });

  it('opens the policy form on a record, wired to close and to reload when done', () => {
    renderWithProviders(<PoliciesPage />);
    const form = dashboardProps().renderForm(ROW);
    expect(form.type).toBe(PolicyForm);
    expect(form.props).toEqual({ initial: ROW, onCancel: crud.close, onDone: crud.onDone });
  });

  it('hands the grid publish, edit and delete to their owners', () => {
    renderWithProviders(<PoliciesPage />);
    const { actions } = dashboardProps().context;
    expect(actions.publish).toBe(gql.publish);
    expect(actions.edit).toBe(crud.openEdit);
    expect(actions.delete).toBe(crud.remove);
  });

  it('re-reads the stats and the grid once a policy is published', async () => {
    renderWithProviders(<PoliciesPage />);
    await gql.onPublished?.();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(crud.onDone).toHaveBeenCalledTimes(1);
  });

  it('opens who has signed a policy from the grid, and closes it again', async () => {
    renderWithProviders(<PoliciesPage />);
    expect(screen.queryByText(/Signers of/)).not.toBeInTheDocument();

    act(() => {
      dashboardProps().context.actions.signers(ROW);
    });
    expect(screen.getByText('Signers of Acceptable use')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Done reading' }));
    await waitFor(() => expect(screen.queryByText(/Signers of/)).not.toBeInTheDocument());
  });
});
