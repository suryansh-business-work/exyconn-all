import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import {
  ItAccessKind,
  ItDecision,
  ListItAccessRequestsPagedDocument,
} from '@exyconn/shell/graphql/generated';
import { AccessManagementPage } from '../../../../src/pages/access';
import { AccessRequestForm } from '../../../../src/pages/access/forms/access-request';
import { ACCESS_COLUMNS } from '../../../../src/pages/access/access-grid';
import {
  crud,
  dashboardProps,
  fetchRows,
  fetcherCall,
  resetPage,
  resourceOptions,
  statPairs,
  statsOf,
} from '../../core/crud-page.mocks';
import { formatDate } from '../../core/settings.mock';
import { press, toast } from '../../core/form.helpers';
import { accessRow } from '../../core/rows.fixtures';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  remove: vi.fn(),
  decide: vi.fn(),
  fulfil: vi.fn(),
  cancel: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/crud', async () => (await import('../../core/crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListItAccessRequestsStatsQuery: gql.stats,
  useDeleteItAccessRequestMutation: () => [gql.remove],
  useDecideItAccessRequestMutation: () => [gql.decide],
  useFulfilItAccessRequestMutation: () => [gql.fulfil],
  useCancelItAccessRequestMutation: () => [gql.cancel],
}));

const answer = (data: object | undefined, loading: boolean) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

const row = accessRow();

describe('Access Management', () => {
  beforeEach(() => {
    resetPage();
    Object.values(gql).forEach((fn) => fn.mockReset());
    answer(undefined, true);
  });

  it('lists every kind of request under its own export name', () => {
    renderWithProviders(<AccessManagementPage />);
    const props = dashboardProps();
    expect(props).toMatchObject({
      title: 'Access Management',
      entityLabel: 'access request',
      exportFileName: 'access-requests',
      permissionModule: 'ItAccessRequest',
      columnDefs: ACCESS_COLUMNS,
      fetchRows,
      crud,
      searchPlaceholder: 'Search by employee, application or reason…',
    });
    expect(fetcherCall().document).toBe(ListItAccessRequestsPagedDocument);
    expect(fetcherCall().filters).toEqual([]);
    const paged = { rows: [row], totalCount: 1 };
    expect(fetcherCall().select({ listItAccessRequestsPaged: paged })).toBe(paged);
  });

  it('opens a new request as a grant the requester may change', () => {
    renderWithProviders(<AccessManagementPage />);
    const form = dashboardProps().renderForm?.(null);
    expect(form?.type).toBe(AccessRequestForm);
    expect(form?.props).toEqual({
      initial: null,
      kind: ItAccessKind.Grant,
      lockKind: false,
      onCancel: crud.close,
      onDone: crud.onDone,
    });
  });

  it('shows placeholders until the stats answer, then counts each card', () => {
    const { rerender } = renderWithProviders(<AccessManagementPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statPairs().map(([, value]) => value)).toEqual(['0', '0', '0', '0']);

    answer(
      {
        listItAccessRequestsStats: statsOf(9, {
          status: { PENDING: 4, APPROVED: 2 },
          kind: { PASSWORD_RESET: 3 },
        }),
      },
      true,
    );
    rerender(<AccessManagementPage />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs()).toEqual([
      ['Requests', '9'],
      ['Awaiting decision', '4'],
      ['Approved, to do', '2'],
      ['Password resets', '3'],
    ]);
  });

  it('deletes by id after confirming by application, then reloads its stats', async () => {
    gql.remove.mockResolvedValue({ data: {} });
    renderWithProviders(<AccessManagementPage />);
    const options = resourceOptions();
    expect(options.label).toBe('Request');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(row)).toEqual({
      message: 'Delete the request for {app}?',
      values: { app: 'Slack' },
    });
    await options.onDelete(row);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'acc-1' } });
  });

  it('hands edit, delete and the viewer date format to the grid', () => {
    renderWithProviders(<AccessManagementPage />);
    const { context } = dashboardProps();
    expect(context.actions.edit).toBe(crud.openEdit);
    expect(context.actions.delete).toBe(crud.remove);
    expect(context.formatDate).toBe(formatDate);
  });

  it('marks an approved request done and reloads the grid', async () => {
    gql.fulfil.mockResolvedValue({ data: {} });
    renderWithProviders(<AccessManagementPage />);
    await act(async () => {
      await dashboardProps().context.actions.fulfil(row);
    });
    expect(gql.fulfil).toHaveBeenCalledWith({ variables: { id: 'acc-1' } });
    expect(crud.reload).toHaveBeenCalledTimes(1);
    expect(await toast()).toHaveTextContent('Marked as done');
  });

  it('says why a cancel failed and does not reload', async () => {
    gql.cancel.mockRejectedValue(new Error('Already fulfilled'));
    renderWithProviders(<AccessManagementPage />);
    await act(async () => {
      await dashboardProps().context.actions.cancel(row);
    });
    expect(gql.cancel).toHaveBeenCalledWith({ variables: { id: 'acc-1' } });
    expect(crud.reload).not.toHaveBeenCalled();
    expect(await toast()).toHaveTextContent('Already fulfilled');
  });

  it('decides the chosen request in a drawer named after it, then reloads', async () => {
    gql.decide.mockResolvedValue({ data: {} });
    renderWithProviders(<AccessManagementPage />);
    act(() => {
      dashboardProps().context.actions.decide(row);
    });
    expect(screen.getByRole('heading', { name: 'Ana Rao — Slack' })).toBeInTheDocument();

    await press('Record decision');
    await waitFor(() => expect(crud.reload).toHaveBeenCalledTimes(1));
    expect(gql.decide).toHaveBeenCalledWith({
      variables: { id: 'acc-1', decision: ItDecision.Approved, note: '' },
    });
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Ana Rao — Slack' })).not.toBeInTheDocument(),
    );
  });

  it('sends no id when nothing has been chosen to decide', async () => {
    gql.decide.mockResolvedValue({ data: {} });
    renderWithProviders(<AccessManagementPage />);
    const onDecide = dashboardProps().extraDialogs?.props.onDecide as (v: object) => unknown;
    await onDecide({ decision: ItDecision.Rejected, note: 'No' });
    expect(gql.decide).toHaveBeenCalledWith({
      variables: { id: '', decision: ItDecision.Rejected, note: 'No' },
    });
  });
});
