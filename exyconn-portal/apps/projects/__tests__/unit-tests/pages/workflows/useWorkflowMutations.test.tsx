import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { ProjectWorkflowsDocument } from '@exyconn/shell/graphql/generated';
import { useWorkflowMutations } from '../../../../src/pages/workflows/useWorkflowMutations';
import { renderHookWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  options: [] as unknown[],
  notify: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateProjectWorkflowMutation: (options: unknown) => {
    gql.options.push(options);
    return [gql.create];
  },
  useUpdateProjectWorkflowMutation: (options: unknown) => {
    gql.options.push(options);
    return [gql.update];
  },
  useDeleteProjectWorkflowMutation: (options: unknown) => {
    gql.options.push(options);
    return [gql.remove];
  },
}));

vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@exyconn/shell/components/feedback/NotificationProvider')
  >()),
  useNotify: () => gql.notify,
}));

const DETAILS = { name: 'Release sign-off', description: '' };

describe('useWorkflowMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.options = [];
    gql.create.mockResolvedValue({ data: { createProjectWorkflow: { id: 'wf-9' } } });
    gql.update.mockResolvedValue({ data: {} });
    gql.remove.mockResolvedValue({ data: {} });
  });

  it('re-reads the workflow list after every change', () => {
    renderHookWithProviders(() => useWorkflowMutations());

    expect(gql.options).toHaveLength(3);
    for (const options of gql.options) {
      expect(options).toEqual({ refetchQueries: [{ query: ProjectWorkflowsDocument }] });
    }
  });

  it('creates a workflow, says so and returns its id', async () => {
    const { result } = renderHookWithProviders(() => useWorkflowMutations());

    let id: string | null = null;
    await act(async () => {
      id = await result.current.create(DETAILS);
    });

    expect(id).toBe('wf-9');
    expect(gql.create).toHaveBeenCalledWith({ variables: { input: DETAILS } });
    expect(gql.notify).toHaveBeenCalledWith('Workflow created');
  });

  it('returns null when the server answers without a workflow', async () => {
    gql.create.mockResolvedValue({ data: undefined });
    const { result } = renderHookWithProviders(() => useWorkflowMutations());

    let id: string | null = 'unset';
    await act(async () => {
      id = await result.current.create(DETAILS);
    });

    expect(id).toBeNull();
  });

  it('reports a failed create and returns null', async () => {
    gql.create.mockRejectedValue(new Error('Name already taken'));
    const { result } = renderHookWithProviders(() => useWorkflowMutations());

    let id: string | null = 'unset';
    await act(async () => {
      id = await result.current.create(DETAILS);
    });

    expect(id).toBeNull();
    expect(gql.notify).toHaveBeenCalledWith('Name already taken', 'error');
  });

  it('saves the details and says whether it worked', async () => {
    const { result } = renderHookWithProviders(() => useWorkflowMutations());

    await expect(result.current.update('wf-1', DETAILS)).resolves.toBe(true);
    expect(gql.update).toHaveBeenCalledWith({ variables: { id: 'wf-1', input: DETAILS } });
    expect(gql.notify).toHaveBeenCalledWith('Workflow details saved');

    gql.update.mockRejectedValue('offline');
    await expect(result.current.update('wf-1', DETAILS)).resolves.toBe(false);
    expect(gql.notify).toHaveBeenLastCalledWith('Could not save the details', 'error');
  });

  it('deletes a workflow and says whether it worked', async () => {
    const { result } = renderHookWithProviders(() => useWorkflowMutations());

    await expect(result.current.remove('wf-1')).resolves.toBe(true);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'wf-1' } });
    expect(gql.notify).toHaveBeenCalledWith('Workflow deleted');

    gql.remove.mockRejectedValue(new Error('It is in use'));
    await expect(result.current.remove('wf-1')).resolves.toBe(false);
    expect(gql.notify).toHaveBeenLastCalledWith('It is in use', 'error');
  });
});
