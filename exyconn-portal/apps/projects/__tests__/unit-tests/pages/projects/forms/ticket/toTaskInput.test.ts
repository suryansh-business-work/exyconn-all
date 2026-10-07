import { describe, expect, it } from 'vitest';
import { TaskPriority, TaskType } from '@exyconn/shell/graphql/generated';
import { toTaskInput } from '../../../../../../src/pages/projects/forms/ticket';

const VALUES = {
  title: 'Fix login',
  description: '<p>Steps</p>',
  type: TaskType.Story,
  priority: TaskPriority.Low,
  assigneeId: 'emp-1',
  labels: ['auth'],
  storyPoints: '',
  dueDate: '',
};

describe('toTaskInput', () => {
  it('sends unset points and an unset due date as nothing, not zero or blank', () => {
    expect(toTaskInput(VALUES)).toEqual({ ...VALUES, storyPoints: null, dueDate: null });
  });

  it('sends points as a number and a picked due date as it is', () => {
    const input = toTaskInput({ ...VALUES, storyPoints: '5', dueDate: '2026-10-31T00:00:00.000Z' });

    expect(input.storyPoints).toBe(5);
    expect(input.dueDate).toBe('2026-10-31T00:00:00.000Z');
  });
});
