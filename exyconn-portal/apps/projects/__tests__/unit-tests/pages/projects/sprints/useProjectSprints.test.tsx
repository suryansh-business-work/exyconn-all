import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useProjectSprints } from '../../../../../src/pages/projects/sprints';
import { renderHookWithProviders } from '../../../test-utils';
import { sprintRow } from '../../../fixtures';
import { resetSprintDoubles, sprintDoubles } from './sprint-hook.mocks';

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  ...(await import('./sprint-hook.mocks')).apolloOverrides(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  ...(await import('./sprint-hook.mocks')).generatedOverrides(),
}));

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>()),
  ...(await import('./sprint-hook.mocks')).confirmOverrides(),
}));

vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@exyconn/shell/components/feedback/NotificationProvider')
  >()),
  ...(await import('./sprint-hook.mocks')).notifyOverrides(),
}));

const gql = sprintDoubles;
const SPRINT = sprintRow();

function setup(projectId = 'proj-1') {
  const onChanged = vi.fn();
  const view = renderHookWithProviders(() => useProjectSprints(projectId, onChanged));
  return { onChanged, api: () => view.result.current };
}

describe('useProjectSprints', () => {
  beforeEach(() => {
    resetSprintDoubles([SPRINT]);
  });

  it('lists the sprints of the project it is given', () => {
    const { api } = setup();

    expect(api().sprints).toEqual([SPRINT]);
    expect(api().loading).toBe(false);
    expect(gql.sprints).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
  });

  it('skips the query with no project and lists nothing yet', () => {
    gql.sprints.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    const { api } = setup('');

    expect(api().sprints).toEqual([]);
    expect(api().loading).toBe(true);
    expect(gql.sprints).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it('reloads its own list and then tells the caller', async () => {
    const { api, onChanged } = setup();

    await act(() => api().reload());

    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('starts a sprint and says it is running', async () => {
    const { api, onChanged } = setup();

    await act(() => api().start(SPRINT));

    expect(gql.start).toHaveBeenCalledWith({ variables: { id: 'sprint-1' } });
    expect(gql.notify).toHaveBeenCalledWith('{name} is running', 'success', { name: 'Sprint 12' });
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('reports a start the server refused, with a fallback for a non-Error', async () => {
    const { api, onChanged } = setup();

    gql.start.mockRejectedValueOnce(new Error('Another sprint is running'));
    await act(() => api().start(SPRINT));
    expect(gql.notify).toHaveBeenLastCalledWith('Another sprint is running', 'error');

    gql.start.mockRejectedValueOnce('offline');
    await act(() => api().start(SPRINT));
    expect(gql.notify).toHaveBeenLastCalledWith('Action failed', 'error');
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('deletes a sprint after confirming and reloads', async () => {
    const { api, onChanged } = setup();

    await act(() => api().remove(SPRINT));

    expect(gql.confirm).toHaveBeenCalledWith({
      message: 'Delete {name}? Its tickets go back to the backlog.',
      messageValues: { name: 'Sprint 12' },
      confirmText: 'Delete',
    });
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'sprint-1' } });
    expect(gql.notify).toHaveBeenCalledWith('Sprint deleted');
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('keeps a sprint the person decided not to delete, and reports a failed delete', async () => {
    const { api, onChanged } = setup();

    gql.confirm.mockResolvedValueOnce(false);
    await act(() => api().remove(SPRINT));
    expect(gql.remove).not.toHaveBeenCalled();

    gql.remove.mockRejectedValueOnce(new Error('Sprint not found'));
    await act(() => api().remove(SPRINT));
    expect(gql.notify).toHaveBeenLastCalledWith('Sprint not found', 'error');
    expect(onChanged).not.toHaveBeenCalled();
  });
});
