import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { ItDecision, ListItChangesPagedDocument } from '@exyconn/shell/graphql/generated';
import { ChangesPage } from '../../../../src/pages/changes';
import { ChangeForm } from '../../../../src/pages/changes/forms/change';
import { CHANGE_COLUMNS } from '../../../../src/pages/changes/changes-grid';
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
import { fill, pickOption, press } from '../../core/form.helpers';
import { changeRow } from '../../core/rows.fixtures';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  remove: vi.fn(),
  decide: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/crud', async () => (await import('../../core/crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListItChangesStatsQuery: gql.stats,
  useDeleteItChangeMutation: () => [gql.remove],
  useDecideItChangeMutation: () => [gql.decide],
}));

const answer = (data: object | undefined, loading: boolean) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

const row = changeRow();

describe('ChangesPage', () => {
  beforeEach(() => {
    resetPage();
    gql.remove.mockReset();
    gql.decide.mockReset();
    answer(undefined, true);
  });

  it('frames the change register with its columns, export name and actions', () => {
    renderWithProviders(<ChangesPage />);
    const props = dashboardProps();
    expect(props).toMatchObject({
      title: 'Change Management',
      entityLabel: 'change',
      exportFileName: 'changes',
      permissionModule: 'ItChange',
      columnDefs: CHANGE_COLUMNS,
      fetchRows,
      crud,
      searchPlaceholder: 'Search by title, system or owner…',
    });
    expect(props.context.actions.edit).toBe(crud.openEdit);
    expect(props.context.actions.delete).toBe(crud.remove);
    expect(props.context.formatDate).toBe(formatDate);
  });

  it('reads changes from the paged query and opens its own form', () => {
    renderWithProviders(<ChangesPage />);
    const paged = { rows: [row], totalCount: 1 };
    expect(fetcherCall().document).toBe(ListItChangesPagedDocument);
    expect(fetcherCall().select({ listItChangesPaged: paged })).toBe(paged);
    const form = dashboardProps().renderForm?.(row);
    expect(form?.type).toBe(ChangeForm);
    expect(form?.props).toEqual({ initial: row, onCancel: crud.close, onDone: crud.onDone });
  });

  it('counts failed and rolled-back changes together', () => {
    const { rerender } = renderWithProviders(<ChangesPage />);
    expect(dashboardProps().statsLoading).toBe(true);

    answer(
      {
        listItChangesStats: statsOf(14, {
          status: { PENDING_APPROVAL: 3, SCHEDULED: 4, FAILED: 1, ROLLED_BACK: 2 },
        }),
      },
      false,
    );
    rerender(<ChangesPage />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs()).toEqual([
      ['Changes', '14'],
      ['Awaiting approval', '3'],
      ['Scheduled', '4'],
      ['Failed or rolled back', '3'],
    ]);
  });

  it('deletes by id after confirming by title, then reloads its stats', async () => {
    gql.remove.mockResolvedValue({ data: {} });
    renderWithProviders(<ChangesPage />);
    const options = resourceOptions();
    expect(options.label).toBe('Change');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(row)).toEqual({
      message: 'Delete change "{title}"?',
      values: { title: 'Upgrade Mongo' },
    });
    await options.onDelete(row);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'chg-1' } });
  });

  it('rejects a change in a drawer named after it, with the reason, then reloads', async () => {
    gql.decide.mockResolvedValue({ data: {} });
    renderWithProviders(<ChangesPage />);
    act(() => {
      dashboardProps().context.actions.decide(row);
    });
    expect(screen.getByRole('heading', { name: 'Upgrade Mongo' })).toBeInTheDocument();

    await pickOption(/^Decision/, 'Rejected');
    fill('Note', 'No rollback rehearsal yet');
    await press('Record decision');
    await waitFor(() => expect(crud.reload).toHaveBeenCalledTimes(1));
    expect(gql.decide).toHaveBeenCalledWith({
      variables: { id: 'chg-1', decision: ItDecision.Rejected, note: 'No rollback rehearsal yet' },
    });
  });

  it('closes the drawer without deciding', async () => {
    renderWithProviders(<ChangesPage />);
    act(() => {
      dashboardProps().context.actions.decide(row);
    });
    await press('Cancel');
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Upgrade Mongo' })).not.toBeInTheDocument(),
    );
    expect(gql.decide).not.toHaveBeenCalled();
  });

  it('sends no id when nothing has been chosen to decide', async () => {
    gql.decide.mockResolvedValue({ data: {} });
    renderWithProviders(<ChangesPage />);
    const onDecide = dashboardProps().extraDialogs?.props.onDecide as (v: object) => unknown;
    await onDecide({ decision: ItDecision.Approved, note: '' });
    expect(gql.decide).toHaveBeenCalledWith({
      variables: { id: '', decision: ItDecision.Approved, note: '' },
    });
  });
});
