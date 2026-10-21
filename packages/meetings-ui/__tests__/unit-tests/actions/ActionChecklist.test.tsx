import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import {
  MaActionStatus,
  MaPriority,
  MaScope,
  useListEmployeeOptionsQuery,
  useMaActionStatsQuery,
  useMaAddActionCommentMutation,
  useMaBulkUpdateActionItemsMutation,
  useMaCreateActionItemMutation,
  useMaDeleteActionItemMutation,
  useMaSetActionStatusMutation,
  useMaUpdateActionItemMutation,
} from '@exyconn/shell/graphql/generated';
import { ActionChecklist } from '../../../src/actions/ActionChecklist';
import { ActionChecklistPage } from '../../../src/actions/ActionChecklistPage';
import { ACTION_COLUMNS, MEETING_ACTION_COLUMNS } from '../../../src/actions/action-grid';
import type { ActionItemRow } from '../../../src/forms/action-item';
import { EMPLOYEES, STARTED, makeAction } from '../fixtures';
import { gridProps, recorded, type RecordedGrid } from '../grid-stubs';
import { readsPageFrom } from '../fetcher-spy';
import { mutationTuple, queryResult, renderWithProviders } from '../test-utils';

const ROWS = [makeAction(), makeAction({ id: 'action-2', title: 'Book the room' })];

// Renders the real select and done cells for two rows, so the selection runs end to end.
vi.mock('@exyconn/shell/components/data/ServerDataGrid', () => ({
  ServerDataGrid: (props: RecordedGrid) => {
    recorded.grid = props;
    const cell = (key: string) =>
      props.columnDefs.find((column: ColDef) => column.colId === key)
        ?.cellRenderer as ComponentType<ICellRendererParams<ActionItemRow>>;
    const Select = cell('select');
    const Done = cell('done');
    return (
      <>
        {ROWS.map((row) => (
          <div key={row.id}>
            <Select
              {...({ data: row, context: props.context } as ICellRendererParams<ActionItemRow>)}
            />
            <Done
              {...({ data: row, context: props.context } as ICellRendererParams<ActionItemRow>)}
            />
          </div>
        ))}
      </>
    );
  },
}));

vi.mock('../../../src/lib/useScopedFetcher', async (orig) =>
  (await import('../fetcher-spy')).spyOnFetcher(orig),
);

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaActionStatsQuery: vi.fn(),
  useMaDeleteActionItemMutation: vi.fn(),
  useMaSetActionStatusMutation: vi.fn(),
  useMaBulkUpdateActionItemsMutation: vi.fn(),
  useMaCreateActionItemMutation: vi.fn(),
  useMaUpdateActionItemMutation: vi.fn(),
  useMaAddActionCommentMutation: vi.fn(),
  useListEmployeeOptionsQuery: vi.fn(),
}));

const run = {
  delete: vi.fn(),
  setStatus: vi.fn(),
  bulk: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  comment: vi.fn(),
};
const STATS = {
  maActionStats: {
    total: 4,
    pending: 1,
    inProgress: 1,
    blocked: 0,
    completed: 2,
    cancelled: 0,
    overdue: 1,
    needsConfirmation: 1,
  },
};

beforeEach(() => {
  for (const fn of Object.values(run)) {
    fn.mockReset().mockResolvedValue({ data: {} });
  }
  vi.mocked(useMaActionStatsQuery).mockReturnValue(queryResult(STATS) as never);
  vi.mocked(useMaDeleteActionItemMutation).mockReturnValue(mutationTuple(run.delete) as never);
  vi.mocked(useMaSetActionStatusMutation).mockReturnValue(mutationTuple(run.setStatus) as never);
  vi.mocked(useMaBulkUpdateActionItemsMutation).mockReturnValue(mutationTuple(run.bulk) as never);
  vi.mocked(useMaCreateActionItemMutation).mockReturnValue(mutationTuple(run.create) as never);
  vi.mocked(useMaUpdateActionItemMutation).mockReturnValue(mutationTuple(run.update) as never);
  vi.mocked(useMaAddActionCommentMutation).mockReturnValue(mutationTuple(run.comment) as never);
  vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(queryResult(EMPLOYEES) as never);
});

describe('ActionChecklistPage', () => {
  it("shows every meeting's actions with completion tiles and no add button", () => {
    renderWithProviders(<ActionChecklistPage scope="ALL" basePath="/ai/ma" />);
    expect(screen.getByRole('heading', { name: 'Action Checklist', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(gridProps().columnDefs).toBe(ACTION_COLUMNS);
    expect(readsPageFrom('maActionItemsPaged')).toBe(true);
    expect(gridProps().fetchRows.variablesFor?.({ page: 0, pageSize: 5 })).toMatchObject({
      scope: MaScope.All,
    });
    expect(screen.queryByRole('button', { name: 'Add action item' })).not.toBeInTheDocument();
    expect(vi.mocked(useMaActionStatsQuery).mock.lastCall?.[0]).toMatchObject({
      variables: { scope: MaScope.All, meetingId: undefined },
    });
  });

  it("calls it the viewer's own action items in their workspace", () => {
    vi.mocked(useMaActionStatsQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    renderWithProviders(<ActionChecklistPage scope="MINE" basePath="/me/meetings" />);
    expect(screen.getByRole('heading', { name: 'My action items', level: 1 })).toBeInTheDocument();
  });

  it('shows no form for a stale link to a new item on the company checklist', () => {
    renderWithProviders(<ActionChecklist scope="ALL" />, { route: '/?form-action=new' });
    expect(screen.queryByRole('textbox', { name: 'Title' })).not.toBeInTheDocument();
  });
});

describe('ActionChecklist on a meeting', () => {
  it('adds an action item to the meeting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActionChecklist scope="MINE" meetingId="meeting-1" />);
    expect(gridProps().columnDefs).toBe(MEETING_ACTION_COLUMNS);
    await user.click(screen.getByRole('button', { name: 'Add action item' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Write the brief');
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));
    expect(run.create).toHaveBeenCalledWith({
      variables: {
        meetingId: 'meeting-1',
        input: expect.objectContaining({
          title: 'Write the brief',
          status: MaActionStatus.Pending,
        }),
      },
    });
    expect(await screen.findByText('Action item created')).toBeInTheDocument();
  });

  it('completes and reopens an item in place', async () => {
    renderWithProviders(<ActionChecklist scope="MINE" meetingId="meeting-1" />);
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Mark Send the proposal complete' }),
    );
    expect(run.setStatus).toHaveBeenCalledWith({
      variables: { id: 'action-1', status: MaActionStatus.Completed },
    });
    expect(await screen.findByText('Action item completed')).toBeInTheDocument();

    act(() => {
      gridProps().context.actions.toggleDone(makeAction({ status: MaActionStatus.Completed }));
    });
    await vi.waitFor(() =>
      expect(run.setStatus).toHaveBeenLastCalledWith({
        variables: { id: 'action-1', status: MaActionStatus.Pending },
      }),
    );
  });

  it('does not reload after a refused status change', async () => {
    run.setStatus.mockRejectedValue(new Error('Not allowed'));
    renderWithProviders(<ActionChecklist scope="MINE" meetingId="meeting-1" />);
    const signal = gridProps().refreshSignal;
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Mark Send the proposal complete' }),
    );
    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
    expect(gridProps().refreshSignal).toBe(signal);
  });

  it('updates the status and priority of the ticked items together', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActionChecklist scope="ALL" meetingId="meeting-1" />);
    await user.click(screen.getByRole('checkbox', { name: 'Select Send the proposal' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select Book the room' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select Book the room' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select Book the room' }));
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply to selected' }));
    expect(await screen.findByText('Pick a status or a priority to set')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Set priority' }));
    await user.click(await screen.findByRole('option', { name: 'Critical' }));
    await user.click(screen.getByRole('button', { name: 'Apply to selected' }));
    expect(run.bulk).toHaveBeenCalledWith({
      variables: {
        input: { ids: ['action-1', 'action-2'], status: undefined, priority: MaPriority.Critical },
      },
    });
    expect(await screen.findByText('2 action items updated')).toBeInTheDocument();
    expect(screen.queryByText('2 selected')).not.toBeInTheDocument();
  });

  it('keeps the selection when a bulk update fails, and clears it on Cancel', async () => {
    const user = userEvent.setup();
    run.bulk.mockRejectedValue(new Error('Bulk refused'));
    renderWithProviders(<ActionChecklist scope="ALL" meetingId="meeting-1" />);
    await user.click(screen.getByRole('checkbox', { name: 'Select Send the proposal' }));
    await user.click(screen.getByRole('combobox', { name: 'Set status' }));
    await user.click(await screen.findByRole('option', { name: 'Blocked' }));
    await user.click(screen.getByRole('button', { name: 'Apply to selected' }));
    expect(await screen.findByText('Bulk refused')).toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
  });

  it('edits an item, and deletes one after a destructive confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(queryResult(undefined) as never);
    renderWithProviders(<ActionChecklist scope="ALL" meetingId="meeting-1" />);
    act(() => {
      gridProps().context.actions.edit(makeAction());
    });
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Edit action item' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));
    expect(run.update).toHaveBeenCalledWith({
      variables: { id: 'action-1', input: expect.objectContaining({ title: 'Send the proposal' }) },
    });
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), {
      timeout: 10_000,
    });

    act(() => {
      gridProps().context.actions.delete(makeAction());
    });
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(run.delete).toHaveBeenCalledWith({ variables: { id: 'action-1' } });
  });

  it('opens an item with its evidence, comments and history, and adds a comment', async () => {
    const user = userEvent.setup();
    const commented = makeAction({
      comments: [{ id: 'c1', byName: 'Asha Rao', text: 'On it', createdAt: STARTED }],
    });
    run.comment.mockResolvedValue({ data: { maAddActionComment: commented } });
    renderWithProviders(<ActionChecklist scope="ALL" meetingId="meeting-1" />);
    act(() =>
      gridProps().onRowClick?.(
        makeAction({
          needsConfirmation: true,
          overdue: true,
          history: [
            { at: STARTED, byName: 'Asha Rao', field: 'status', from: '', to: 'PENDING' },
            { at: STARTED, byName: 'Asha Rao', field: 'assignedTo', from: 'Ravi', to: '' },
          ],
        }),
      ),
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Why the AI suggested it')).toBeInTheDocument();
    expect(within(dialog).getByText('Ravi will send it by Friday')).toBeInTheDocument();
    expect(within(dialog).getByText('Needs confirmation')).toBeInTheDocument();
    expect(within(dialog).getByText('Overdue')).toBeInTheDocument();
    expect(within(dialog).getByText('status: — → PENDING')).toBeInTheDocument();
    expect(within(dialog).getByText('assignedTo: Ravi → —')).toBeInTheDocument();
    expect(within(dialog).getByText('No comments yet.')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Add comment' }));
    expect(await within(dialog).findByText('Write a comment first')).toBeInTheDocument();
    await user.type(within(dialog).getByRole('textbox', { name: 'Comment' }), 'On it');
    await user.click(within(dialog).getByRole('button', { name: 'Add comment' }));
    expect(run.comment).toHaveBeenCalledWith({ variables: { id: 'action-1', text: 'On it' } });
    expect(await within(dialog).findByText('On it')).toBeInTheDocument();
    expect(within(dialog).queryByText('History')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows a manual item plainly, and keeps a comment that could not be added', async () => {
    const user = userEvent.setup();
    run.comment.mockRejectedValueOnce(new Error('Item deleted'));
    renderWithProviders(<ActionChecklist scope="ALL" meetingId="meeting-1" />);
    act(() => gridProps().onRowClick?.(makeAction({ aiGenerated: false, description: '' })));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByText('Why the AI suggested it')).not.toBeInTheDocument();
    const box = within(dialog).getByRole('textbox', { name: 'Comment' });
    await user.type(box, 'Hello');
    await user.click(within(dialog).getByRole('button', { name: 'Add comment' }));
    expect(await screen.findByText('Item deleted')).toBeInTheDocument();
    expect(box).toHaveValue('Hello');

    run.comment.mockResolvedValueOnce({ data: undefined });
    await user.click(within(dialog).getByRole('button', { name: 'Add comment' }));
    expect(box).toHaveValue('Hello');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(box).toHaveValue('');
  });
});
