import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GoalStatus,
  useCommentOnTeamGoalMutation,
  useTeamGoalsQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple, queryResult } from '../apolloHookMocks';
import { TeamGoalsSection } from '../../../../../src/pages/employee/team/TeamGoalsSection';
import { goalRow, nameOf } from './teamFixtures';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTeamGoalsQuery: vi.fn(),
  useCommentOnTeamGoalMutation: vi.fn(),
}));

const comment = vi.fn();

function setup(result: Parameters<typeof queryResult>[0]) {
  const refetch = vi.fn().mockResolvedValue(undefined);
  vi.mocked(useTeamGoalsQuery).mockReturnValue(
    queryResult<typeof useTeamGoalsQuery>({ refetch, ...result }),
  );
  renderWithProviders(<TeamGoalsSection nameOf={nameOf} />);
  return { refetch };
}

const ROWS = [
  goalRow(),
  goalRow({
    id: 'goal-2',
    employeeId: 'emp-2',
    title: 'Cut churn',
    kpi: 'Churn %',
    progress: 100,
    status: GoalStatus.Completed,
    managerComment: 'Great result',
  }),
];

async function openComment(rowIndex: number) {
  const row = screen.getAllByRole('row')[rowIndex];
  await userEvent.click(within(row).getByRole('button', { name: 'comment on goal' }));
  return screen.findByRole('dialog');
}

beforeEach(() => {
  comment.mockReset();
  vi.mocked(useCommentOnTeamGoalMutation).mockReturnValue(
    mutationTuple<typeof useCommentOnTeamGoalMutation>(comment),
  );
});

describe('TeamGoalsSection', () => {
  it('lists each goal with owner, KPI, due date, progress, status and comment', () => {
    setup({ data: { teamGoals: ROWS } });

    expect(useTeamGoalsQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByText('Goals')).toBeInTheDocument();
    const [, first, second] = screen.getAllByRole('row');
    expect(within(first).getByText('Asha Rao')).toBeInTheDocument();
    expect(within(first).getByText('Ship v2')).toBeInTheDocument();
    expect(within(first).getByText('Release date')).toBeInTheDocument();
    expect(within(first).getByText('30 Jun 2026')).toBeInTheDocument();
    expect(within(first).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
    expect(within(first).getByText('40%')).toBeInTheDocument();
    expect(within(first).getByText('ACTIVE')).toBeInTheDocument();
    expect(within(first).getByText('—')).toBeInTheDocument();
    expect(within(second).getByText('Vikram Shah')).toBeInTheDocument();
    expect(within(second).getByText('Great result')).toBeInTheDocument();
  });

  it('says so when the team has no goals', () => {
    setup({ data: { teamGoals: [] } });
    expect(screen.getByText('No goals are set for your team.')).toBeInTheDocument();
  });

  it('shows placeholder rows while loading', () => {
    setup({ loading: true });
    expect(screen.queryByText('No goals are set for your team.')).toBeNull();
    expect(screen.getByRole('table').closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true');
  });

  it('opens a comment on the chosen goal, starting from the saved comment', async () => {
    setup({ data: { teamGoals: ROWS } });
    const dialog = await openComment(2);

    expect(
      within(dialog).getByRole('heading', { name: 'Comment on “Cut churn”' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Your comment')).toHaveValue('Great result');
  });

  it('cancels the comment without saving', async () => {
    setup({ data: { teamGoals: ROWS } });
    const dialog = await openComment(1);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(comment).not.toHaveBeenCalled();
  });

  it('closes the comment from its close button', async () => {
    setup({ data: { teamGoals: ROWS } });
    const dialog = await openComment(1);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('saves the comment, closes and refreshes the goals', async () => {
    comment.mockResolvedValue({ data: { commentOnTeamGoal: { id: 'goal-1' } } });
    const { refetch } = setup({ data: { teamGoals: ROWS } });
    const dialog = await openComment(1);

    await userEvent.type(within(dialog).getByLabelText('Your comment'), 'On track');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save comment' }));

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(comment).toHaveBeenCalledWith({ variables: { id: 'goal-1', comment: 'On track' } });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
