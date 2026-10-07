import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SprintState } from '@exyconn/shell/graphql/generated';
import { ProjectSprintsPage } from '../../../../../src/pages/projects/sprints';
import { renderWithProviders } from '../../../test-utils';
import { sprintRow, taskRow } from '../../../fixtures';

const api = vi.hoisted(() => ({
  board: vi.fn(),
  boardRefetch: vi.fn(),
  state: {} as Record<string, unknown>,
  onChanged: null as null | (() => void),
  reload: vi.fn(),
  start: vi.fn(),
  complete: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectBoardQuery: (options: unknown) => api.board(options),
}));

vi.mock('../../../../../src/pages/projects/sprints/useProjectSprints', () => ({
  useProjectSprints: (_projectId: string, onChanged: () => void) => {
    api.onChanged = onChanged;
    return api.state;
  },
}));

vi.mock('../../../../../src/pages/projects/sprints/ProjectMilestones', () => ({
  ProjectMilestones: ({ projectId }: Readonly<{ projectId: string }>) => (
    <p>{`Milestones of ${projectId}`}</p>
  ),
}));

vi.mock('../../../../../src/pages/projects/forms/sprint', async () => ({
  SprintForm: (await import('../../../helpers/form-stub')).FormStub,
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: (value: string) => value.slice(0, 10) }),
}));

const COLUMNS = [
  { __typename: 'BoardColumn', id: 'todo', name: 'To do', order: 0, isDone: false },
  { __typename: 'BoardColumn', id: 'done', name: 'Done', order: 1, isDone: true },
];

function setSprints(sprints: unknown[], loading = false) {
  api.state = {
    sprints,
    loading,
    reload: api.reload,
    start: api.start,
    complete: api.complete,
    remove: api.remove,
  };
}

describe('ProjectSprintsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.boardRefetch.mockResolvedValue({});
    api.reload.mockResolvedValue(undefined);
    api.board.mockReturnValue({
      data: {
        projectBoard: {
          columns: COLUMNS,
          tasks: [
            taskRow({ id: 't1', sprintId: 'sprint-1', storyPoints: 3, columnId: 'done' }),
            taskRow({ id: 't2', sprintId: 'sprint-1', storyPoints: 1, columnId: 'todo' }),
          ],
        },
      },
      refetch: api.boardRefetch,
    });
    setSprints([sprintRow()]);
  });

  it('measures each sprint against the board columns and shows its window', () => {
    renderWithProviders(<ProjectSprintsPage projectId="proj-1" />);

    expect(screen.getByText('Sprints (1)')).toBeInTheDocument();
    expect(screen.getByText('2026-10-01 → 2026-10-14 · Ship sign-in')).toBeInTheDocument();
    expect(screen.getByText('3/4 pts · 1/2 tickets')).toBeInTheDocument();
    expect(screen.getByText('Milestones of proj-1')).toBeInTheDocument();
    expect(api.board).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
  });

  it('writes a dash for a missing end of the window, and says when neither is set', () => {
    setSprints([
      sprintRow({ id: 's1', name: 'Open start', startsOn: null, goal: '' }),
      sprintRow({ id: 's2', name: 'Open end', endsOn: null, goal: '' }),
      sprintRow({ id: 's3', name: 'Undated', startsOn: null, endsOn: null, goal: '' }),
    ]);
    renderWithProviders(<ProjectSprintsPage projectId="proj-1" />);

    expect(screen.getByText('— → 2026-10-14')).toBeInTheDocument();
    expect(screen.getByText('2026-10-01 → —')).toBeInTheDocument();
    expect(screen.getByText('No dates set')).toBeInTheDocument();
  });

  it('counts nothing complete on a board that has not loaded, and skips it without a project', () => {
    api.board.mockReturnValue({ data: undefined, refetch: api.boardRefetch });
    renderWithProviders(<ProjectSprintsPage projectId="" />);

    expect(screen.getByText('0/0 pts · 0/0 tickets')).toBeInTheDocument();
    expect(api.board).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it('hands each lifecycle action of a card to the sprint hook', async () => {
    const planned = sprintRow({ id: 's-a', name: 'Alpha', state: SprintState.Planned });
    const active = sprintRow({ id: 's-b', name: 'Beta', state: SprintState.Active });
    setSprints([planned, active]);
    renderWithProviders(<ProjectSprintsPage projectId="proj-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    await userEvent.click(screen.getByRole('button', { name: 'Complete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete sprint Beta' }));

    expect(api.start).toHaveBeenCalledWith(planned);
    expect(api.complete).toHaveBeenCalledWith(active);
    expect(api.remove).toHaveBeenCalledWith(active);
  });

  it('reloads the board whenever the sprints change', async () => {
    renderWithProviders(<ProjectSprintsPage projectId="proj-1" />);

    await act(async () => {
      api.onChanged?.();
    });

    expect(api.boardRefetch).toHaveBeenCalledTimes(1);
  });

  it('keeps showing the sprints when a reload fails', async () => {
    api.boardRefetch.mockRejectedValueOnce(new Error('offline'));
    api.reload.mockRejectedValueOnce(new Error('offline'));
    renderWithProviders(<ProjectSprintsPage projectId="proj-1" />);

    await act(async () => {
      api.onChanged?.();
    });
    await userEvent.click(screen.getByRole('button', { name: 'New sprint' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(api.boardRefetch).toHaveBeenCalledTimes(1);
    expect(api.reload).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Sprints (1)')).toBeInTheDocument();
  });

  it('says how to start when there are no sprints, but not while they load', () => {
    setSprints([]);
    const { unmount } = renderWithProviders(<ProjectSprintsPage projectId="proj-1" />);
    const empty = 'No sprints yet. Plan one and tickets can be committed to it from the board.';
    expect(screen.getByText(empty)).toBeInTheDocument();
    unmount();

    setSprints([], true);
    renderWithProviders(<ProjectSprintsPage projectId="proj-1" />);
    expect(screen.queryByText(empty)).not.toBeInTheDocument();
  });

  it('plans a new sprint on its own page and reloads after saving', async () => {
    renderWithProviders(<ProjectSprintsPage projectId="proj-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'New sprint' }));
    expect(screen.getByRole('heading', { name: 'New sprint' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(api.reload).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Sprints (1)')).toBeInTheDocument();
  });

  it('returns to the list without saving from cancel or back', async () => {
    renderWithProviders(<ProjectSprintsPage projectId="proj-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'New sprint' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.getByText('Sprints (1)')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'New sprint' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Sprints (1)')).toBeInTheDocument();
    expect(api.reload).not.toHaveBeenCalled();
  });
});
