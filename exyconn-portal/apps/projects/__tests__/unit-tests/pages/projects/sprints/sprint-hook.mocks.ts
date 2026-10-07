import { vi } from 'vitest';

/**
 * The doubles behind both useProjectSprints test files. Each file's `vi.mock` factories read
 * them through the override helpers below, and the tests drive and assert on the same object.
 * Kept free of source imports: a factory loads this file while its own module is being mocked.
 */
export const sprintDoubles = {
  sprints: vi.fn(),
  refetch: vi.fn(),
  start: vi.fn(),
  complete: vi.fn(),
  remove: vi.fn(),
  query: vi.fn(),
  confirm: vi.fn(),
  notify: vi.fn(),
};

/** The completion plan the server answers with. */
export const completionPlan = (unfinishedCount: number) => ({
  data: {
    sprintCompletionPlan: { unfinishedCount, targetSprintId: null, targetSprintName: 'Backlog' },
  },
});

export const apolloOverrides = () => ({
  useApolloClient: () => ({ query: sprintDoubles.query }),
});

export const generatedOverrides = () => ({
  useProjectSprintsQuery: (options: unknown) => sprintDoubles.sprints(options),
  useStartSprintMutation: () => [sprintDoubles.start],
  useCompleteSprintMutation: () => [sprintDoubles.complete],
  useDeleteSprintMutation: () => [sprintDoubles.remove],
});

export const confirmOverrides = () => ({ useConfirm: () => sprintDoubles.confirm });

export const notifyOverrides = () => ({ useNotify: () => sprintDoubles.notify });

/** Every call answers successfully, the list holds `sprints` and every confirm is accepted. */
export function resetSprintDoubles(sprints: unknown[]) {
  vi.clearAllMocks();
  sprintDoubles.refetch.mockResolvedValue({});
  sprintDoubles.start.mockResolvedValue({});
  sprintDoubles.complete.mockResolvedValue({});
  sprintDoubles.remove.mockResolvedValue({});
  sprintDoubles.confirm.mockResolvedValue(true);
  sprintDoubles.query.mockResolvedValue(completionPlan(0));
  sprintDoubles.sprints.mockReturnValue({
    data: { projectSprints: sprints },
    loading: false,
    refetch: sprintDoubles.refetch,
  });
}
