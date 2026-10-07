import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalStatus, useCommentOnTeamGoalMutation } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { mutationTuple } from '../../apolloHookMocks';
import {
  GoalCommentForm,
  type TeamGoalRow,
} from '../../../../../../src/pages/employee/forms/goal-comment';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCommentOnTeamGoalMutation: vi.fn(),
}));

const goal = (managerComment: string | null): TeamGoalRow => ({
  id: 'goal-1',
  employeeId: 'emp-1',
  title: 'Ship v2',
  kpi: 'Release date',
  weightage: 40,
  endDate: '2026-06-30T00:00:00.000Z',
  progress: 50,
  status: GoalStatus.Active,
  managerComment,
});

const comment = vi.fn();

function setup(managerComment: string | null = null) {
  const onCancel = vi.fn();
  const onDone = vi.fn();
  renderWithProviders(
    <GoalCommentForm goal={goal(managerComment)} onCancel={onCancel} onDone={onDone} />,
  );
  return { onCancel, onDone };
}

const field = () => screen.getByLabelText('Your comment');
const save = () => userEvent.click(screen.getByRole('button', { name: 'Save comment' }));

beforeEach(() => {
  comment.mockReset();
  vi.mocked(useCommentOnTeamGoalMutation).mockReturnValue(
    mutationTuple<typeof useCommentOnTeamGoalMutation>(comment),
  );
});

describe('GoalCommentForm', () => {
  it('starts from the comment already left, with a hint on who sees it', () => {
    setup('Good pace so far');
    expect(field()).toHaveValue('Good pace so far');
    expect(screen.getByText('The employee sees this next to the goal.')).toBeInTheDocument();
  });

  it('starts empty when there is no comment yet and requires one', async () => {
    setup();
    expect(field()).toHaveValue('');
    await userEvent.type(field(), '   ');
    await save();

    expect(await screen.findByText('Comment is required')).toBeInTheDocument();
    expect(comment).not.toHaveBeenCalled();
  });

  it('caps the comment at 1000 characters', async () => {
    setup();
    fireEvent.change(field(), { target: { value: 'a'.repeat(1001) } });
    await save();

    expect(await screen.findByText('Keep it under 1000 characters')).toBeInTheDocument();
    expect(comment).not.toHaveBeenCalled();
  });

  it('saves the trimmed comment against the goal and reports done', async () => {
    comment.mockResolvedValue({ data: { commentOnTeamGoal: { id: 'goal-1' } } });
    const { onDone } = setup();
    await userEvent.type(field(), ' Keep going ');
    await save();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(comment).toHaveBeenCalledWith({ variables: { id: 'goal-1', comment: 'Keep going' } });
    expect(await screen.findByText('Comment saved')).toBeInTheDocument();
  });

  it('shows the server’s message when saving fails', async () => {
    comment.mockRejectedValue(new Error('Goal is closed'));
    const { onDone } = setup('Old note');
    await save();

    expect(await screen.findByText('Goal is closed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    comment.mockRejectedValue(500);
    setup('Old note');
    await save();

    expect(await screen.findByText('Could not save the comment')).toBeInTheDocument();
  });

  it('cancels without saving', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
