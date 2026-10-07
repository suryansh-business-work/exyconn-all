import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { SprintCompletionPlanDocument } from '@exyconn/shell/graphql/generated';
import { useProjectSprints } from '../../../../../src/pages/projects/sprints';
import { renderHookWithProviders } from '../../../test-utils';
import { sprintRow } from '../../../fixtures';
import { completionPlan, resetSprintDoubles, sprintDoubles } from './sprint-hook.mocks';

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

describe('useProjectSprints completing a sprint', () => {
  beforeEach(() => {
    resetSprintDoubles([SPRINT]);
  });

  it('asks the server where leftovers go before confirming a completion', async () => {
    const { api, onChanged } = setup();

    await act(() => api().complete(SPRINT));

    expect(gql.query).toHaveBeenCalledWith({
      query: SprintCompletionPlanDocument,
      variables: { id: 'sprint-1' },
      fetchPolicy: 'network-only',
    });
    expect(gql.confirm).toHaveBeenCalledWith({
      title: 'Complete {name}',
      titleValues: { name: 'Sprint 12' },
      message: 'Everything in {name} is done. Complete it?',
      messageValues: { name: 'Sprint 12', count: 0, target: 'Backlog' },
      confirmText: 'Complete',
    });
    expect(gql.complete).toHaveBeenCalledWith({ variables: { id: 'sprint-1' } });
    expect(gql.notify).toHaveBeenCalledWith('{name} is complete', 'success', { name: 'Sprint 12' });
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('words the confirmation for one leftover and for several', async () => {
    const { api } = setup();

    gql.query.mockResolvedValueOnce(completionPlan(1));
    await act(() => api().complete(SPRINT));
    expect(gql.confirm).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: '{count} unfinished ticket will move to {target}. Complete {name}?',
      }),
    );

    gql.query.mockResolvedValueOnce(completionPlan(3));
    await act(() => api().complete(SPRINT));
    expect(gql.confirm).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: '{count} unfinished tickets will move to {target}. Complete {name}?',
        messageValues: { name: 'Sprint 12', count: 3, target: 'Backlog' },
      }),
    );
  });

  it('completes nothing when the person backs out', async () => {
    gql.confirm.mockResolvedValueOnce(false);
    const { api, onChanged } = setup();

    await act(() => api().complete(SPRINT));

    expect(gql.complete).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('reports a plan that came back empty rather than guessing', async () => {
    gql.query.mockResolvedValueOnce({ data: undefined });
    const { api } = setup();

    await act(() => api().complete(SPRINT));

    expect(gql.confirm).not.toHaveBeenCalled();
    expect(gql.notify).toHaveBeenCalledWith('The sprint completion plan returned no data', 'error');
  });
});
