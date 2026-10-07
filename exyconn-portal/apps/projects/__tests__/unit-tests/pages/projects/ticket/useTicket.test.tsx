import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { TaskPriority, type TaskInput } from '@exyconn/shell/graphql/generated';
import { useTicket } from '../../../../../src/pages/projects/ticket';
import { renderHookWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({
  update: vi.fn(),
  saving: false,
  remove: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdateTaskMutation: () => [gql.update, { loading: gql.saving }],
  useDeleteTaskMutation: () => [gql.remove],
}));

vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@exyconn/shell/components/feedback/NotificationProvider')
  >()),
  useNotify: () => gql.notify,
}));

const INPUT: TaskInput = { title: 'Login fails', priority: TaskPriority.Highest };

function setup() {
  const onChanged = vi.fn();
  const view = renderHookWithProviders(() => useTicket(onChanged));
  return { onChanged, ticket: () => view.result.current };
}

describe('useTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.saving = false;
    gql.update.mockResolvedValue({});
    gql.remove.mockResolvedValue({});
  });

  it('passes on whether a save is in flight', () => {
    gql.saving = true;
    expect(setup().ticket().saving).toBe(true);
  });

  it('saves a ticket, says so, tells the caller and reports success', async () => {
    const { ticket, onChanged } = setup();

    let saved = false;
    await act(async () => {
      saved = await ticket().save('task-1', INPUT);
    });

    expect(saved).toBe(true);
    expect(gql.update).toHaveBeenCalledWith({ variables: { id: 'task-1', input: INPUT } });
    expect(gql.notify).toHaveBeenCalledWith('Ticket saved');
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('reports a failed save with the server reason and changes nothing', async () => {
    gql.update.mockRejectedValueOnce(new Error('Title is required'));
    const { ticket, onChanged } = setup();

    let saved = true;
    await act(async () => {
      saved = await ticket().save('task-1', INPUT);
    });

    expect(saved).toBe(false);
    expect(gql.notify).toHaveBeenCalledWith('Title is required', 'error');
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('deletes a ticket, says so and tells the caller', async () => {
    const { ticket, onChanged } = setup();

    let removed = false;
    await act(async () => {
      removed = await ticket().remove('task-1');
    });

    expect(removed).toBe(true);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'task-1' } });
    expect(gql.notify).toHaveBeenCalledWith('Ticket deleted');
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('reports a failed delete generically when the failure is not an Error', async () => {
    gql.remove.mockRejectedValueOnce({ code: 500 });
    const { ticket, onChanged } = setup();

    let removed = true;
    await act(async () => {
      removed = await ticket().remove('task-1');
    });

    expect(removed).toBe(false);
    expect(gql.notify).toHaveBeenCalledWith('Action failed', 'error');
    expect(onChanged).not.toHaveBeenCalled();
  });
});
