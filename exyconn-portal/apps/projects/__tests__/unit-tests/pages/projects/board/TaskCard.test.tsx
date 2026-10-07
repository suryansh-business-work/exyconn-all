import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskPriority, TaskType } from '@exyconn/shell/graphql/generated';
import type { TaskFieldsFragment } from '@exyconn/shell/graphql/generated';
import { TaskCard } from '../../../../../src/pages/projects/board';
import { renderWithProviders } from '../../../test-utils';
import { taskRow } from '../../../fixtures';
import { DndWrapper } from './dnd-wrapper';

const renderCard = (task: TaskFieldsFragment) => {
  const onOpen = vi.fn();
  renderWithProviders(
    <DndWrapper ids={[task.id]}>
      <TaskCard task={task} onOpen={onOpen} />
    </DndWrapper>,
  );
  return { onOpen };
};

const FULL = taskRow({
  type: TaskType.Story,
  priority: TaskPriority.Lowest,
  storyPoints: 3,
  assigneeName: 'Asha Rao',
  labels: ['ui', 'auth'],
});

describe('TaskCard', () => {
  it('spells out everything the card shows for a screen reader', () => {
    renderCard(FULL);

    expect(
      screen.getByRole('button', {
        name: 'EXY-1: Login fails, Type: Story, Priority: Lowest, 3 points, Assigned to Asha Rao, Labels: ui, auth',
      }),
    ).toBeInTheDocument();
  });

  it('shows the summary, key, points, the assignee’s initials and the labels', () => {
    renderCard(FULL);

    expect(screen.getByText('Login fails')).toBeInTheDocument();
    expect(screen.getByText('EXY-1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('AR')).toBeInTheDocument();
    expect(screen.getByText('ui')).toBeInTheDocument();
    expect(screen.getByText('auth')).toBeInTheDocument();
  });

  it('leaves out the points, avatar and labels a ticket does not have', () => {
    renderCard(taskRow());

    expect(
      screen.getByRole('button', { name: 'EXY-1: Login fails, Type: Bug, Priority: High' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('AR')).not.toBeInTheDocument();
  });

  it('counts a zero-point ticket as sized', () => {
    renderCard(taskRow({ storyPoints: 0 }));

    expect(screen.getByRole('button', { name: /, 0 points$/ })).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('opens the ticket on a click, Enter or Space, but not on other keys', async () => {
    const { onOpen } = renderCard(taskRow());
    const card = screen.getByRole('button', { name: /^EXY-1: Login fails/ });

    await userEvent.click(card);
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    fireEvent.keyDown(card, { key: 'a' });

    expect(onOpen.mock.calls).toEqual([['task-1'], ['task-1'], ['task-1']]);
  });

  it('drags only by its grip, which names the ticket', () => {
    renderCard(taskRow());

    expect(screen.getByRole('button', { name: 'Drag EXY-1' })).toBeInTheDocument();
  });
});
