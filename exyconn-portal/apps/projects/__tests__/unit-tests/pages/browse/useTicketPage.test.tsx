import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { TaskVisibility } from '@exyconn/shell/graphql/generated';
import { useTicketPage } from '../../../../src/pages/browse/useTicketPage';
import { renderHookWithProviders } from '../../test-utils';
import { taskRow } from '../../fixtures';
import { COLUMNS, pageTicket } from './browse-fixtures';

const gql = vi.hoisted(() => ({
  byKey: vi.fn(),
  project: vi.fn(),
  columns: vi.fn(),
  tasks: vi.fn(),
  members: vi.fn(),
  move: vi.fn(),
  setVisibility: vi.fn(),
  switching: false,
  refetchTicket: vi.fn(),
  refetchTasks: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTaskByKeyQuery: (options: unknown) => gql.byKey(options),
  useGetProjectQuery: (options: unknown) => gql.project(options),
  useProjectColumnsQuery: (options: unknown) => gql.columns(options),
  useProjectTasksQuery: (options: unknown) => gql.tasks(options),
  useListProjectMembersQuery: () => gql.members(),
  useMoveTaskMutation: () => [gql.move],
  useSetTaskVisibilityMutation: () => [gql.setVisibility, { loading: gql.switching }],
}));

vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@exyconn/shell/components/feedback/NotificationProvider')
  >()),
  useNotify: () => gql.notify,
}));

const TICKET = pageTicket();
const TASKS = [
  taskRow({ id: 'task-1', columnId: 'todo' }),
  taskRow({ id: 'task-2', columnId: 'done' }),
  taskRow({ id: 'task-3', columnId: 'done' }),
  taskRow({ id: 'task-4', columnId: 'todo' }),
];

const renderPage = (key = 'EXY-1') => renderHookWithProviders(() => useTicketPage(key));

describe('useTicketPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.switching = false;
    gql.refetchTicket.mockResolvedValue({});
    gql.refetchTasks.mockResolvedValue({});
    gql.move.mockResolvedValue({ data: {} });
    gql.setVisibility.mockResolvedValue({ data: {} });
    gql.byKey.mockReturnValue({
      data: { taskByKey: TICKET },
      loading: false,
      error: undefined,
      refetch: gql.refetchTicket,
    });
    gql.project.mockReturnValue({ data: { getProject: { id: 'proj-1', name: 'Website' } } });
    gql.columns.mockReturnValue({ data: { projectColumns: COLUMNS } });
    gql.tasks.mockReturnValue({ data: { projectTasks: TASKS }, refetch: gql.refetchTasks });
    gql.members.mockReturnValue({
      data: { listProjectMembers: [{ id: 'emp-1', name: 'Priya', email: 'priya@acme.io' }] },
    });
  });

  it('reads the ticket by key, then its project, columns and tickets by project', () => {
    const { result } = renderPage();

    expect(gql.byKey).toHaveBeenCalledWith({
      variables: { key: 'EXY-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
    expect(gql.project).toHaveBeenCalledWith({ variables: { id: 'proj-1' }, skip: false });
    expect(gql.columns).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
    expect(gql.tasks).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
    expect(result.current.ticket).toBe(TICKET);
    expect(result.current.project).toEqual({ id: 'proj-1', name: 'Website' });
    expect(result.current.columns).toBe(COLUMNS);
    expect(result.current.tickets).toBe(TASKS);
    expect(result.current.people).toEqual([{ value: 'emp-1', label: 'Priya' }]);
    expect(result.current.loading).toBe(false);
    expect(result.current.switching).toBe(false);
  });

  it('is loading before the ticket answers, and skips the rest until it has a project', () => {
    gql.byKey.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: gql.refetchTicket,
    });
    gql.project.mockReturnValue({ data: undefined });
    gql.columns.mockReturnValue({ data: undefined });
    gql.tasks.mockReturnValue({ data: undefined, refetch: gql.refetchTasks });
    gql.members.mockReturnValue({ data: undefined });
    const { result } = renderPage('');

    expect(gql.byKey).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
    expect(gql.project).toHaveBeenCalledWith({ variables: { id: '' }, skip: true });
    expect(result.current.loading).toBe(true);
    expect(result.current.ticket).toBeNull();
    expect(result.current.project).toBeNull();
    expect(result.current.columns).toEqual([]);
    expect(result.current.tickets).toEqual([]);
    expect(result.current.people).toEqual([]);
  });

  it('is not loading while it refreshes a ticket it has, and passes on errors', () => {
    const error = new Error('No access');
    gql.byKey.mockReturnValue({
      data: { taskByKey: TICKET },
      loading: true,
      error,
      refetch: gql.refetchTicket,
    });
    gql.switching = true;
    const { result } = renderPage();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.switching).toBe(true);
  });

  it('reloads the ticket and its project tickets together', async () => {
    const { result } = renderPage();

    act(() => result.current.reload());

    expect(gql.refetchTicket).toHaveBeenCalledTimes(1);
    expect(gql.refetchTasks).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(gql.notify).not.toHaveBeenCalled();
  });

  it('reports a reload that failed', async () => {
    gql.refetchTasks.mockRejectedValue(new Error('Offline'));
    const { result } = renderPage();

    act(() => result.current.reload());

    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Offline', 'error'));
  });

  it('moves the ticket to the bottom of the column chosen, then reloads', async () => {
    const { result } = renderPage();

    await act(() => result.current.move('done'));

    expect(gql.move).toHaveBeenCalledWith({
      variables: { id: 'task-1', toColumnId: 'done', toIndex: 2 },
    });
    expect(gql.notify).toHaveBeenCalledWith('Ticket moved');
    expect(gql.refetchTicket).toHaveBeenCalledTimes(1);
  });

  it('does not count the ticket itself when it moves within its own column', async () => {
    const { result } = renderPage();

    await act(() => result.current.move('todo'));

    expect(gql.move).toHaveBeenCalledWith({
      variables: { id: 'task-1', toColumnId: 'todo', toIndex: 1 },
    });
  });

  it('reports a move that failed and does not reload', async () => {
    gql.move.mockRejectedValue('nope');
    const { result } = renderPage();

    await act(() => result.current.move('done'));

    expect(gql.notify).toHaveBeenCalledWith('Could not move the ticket', 'error');
    expect(gql.refetchTicket).not.toHaveBeenCalled();
  });

  it('makes the ticket public or private and says what that means', async () => {
    const { result } = renderPage();

    await act(() => result.current.changeVisibility(TaskVisibility.Public));
    expect(gql.setVisibility).toHaveBeenCalledWith({
      variables: { id: 'task-1', visibility: TaskVisibility.Public },
    });
    expect(gql.notify).toHaveBeenLastCalledWith(
      'Anyone with the public link can now read this ticket',
    );

    await act(() => result.current.changeVisibility(TaskVisibility.Private));
    expect(gql.notify).toHaveBeenLastCalledWith(
      'Only people signed in to Projects can read this ticket now',
    );
  });

  it('reports a visibility change that failed', async () => {
    gql.setVisibility.mockRejectedValue(new Error('Only admins can publish'));
    const { result } = renderPage();

    await act(() => result.current.changeVisibility(TaskVisibility.Public));

    expect(gql.notify).toHaveBeenCalledWith('Only admins can publish', 'error');
  });

  it('does nothing to a ticket it does not have', async () => {
    gql.byKey.mockReturnValue({
      data: { taskByKey: null },
      loading: false,
      error: undefined,
      refetch: gql.refetchTicket,
    });
    const { result } = renderPage();

    await act(() => result.current.move('done'));
    await act(() => result.current.changeVisibility(TaskVisibility.Public));

    expect(gql.move).not.toHaveBeenCalled();
    expect(gql.setVisibility).not.toHaveBeenCalled();
  });
});
