import { vi } from 'vitest';

/** The three mutations behind Save draft, Publish and Discard draft, and what they were given. */
export const mutations = {
  save: vi.fn(),
  publish: vi.fn(),
  discard: vi.fn(),
  loading: { save: false, publish: false, discard: false },
  options: [] as unknown[],
};

/** Stand-ins for the generated mutation hooks; spread into a `vi.mock` of the generated module. */
export const mutationHooks = {
  useSaveWhatsappWorkflowDraftMutation: (options: unknown) => {
    mutations.options.push(options);
    return [mutations.save, { loading: mutations.loading.save }];
  },
  usePublishWhatsappWorkflowMutation: (options: unknown) => {
    mutations.options.push(options);
    return [mutations.publish, { loading: mutations.loading.publish }];
  },
  useDiscardWhatsappWorkflowDraftMutation: (options: unknown) => {
    mutations.options.push(options);
    return [mutations.discard, { loading: mutations.loading.discard }];
  },
};

export function resetMutations() {
  mutations.save.mockReset().mockResolvedValue({ data: null });
  mutations.publish.mockReset().mockResolvedValue({ data: null });
  mutations.discard.mockReset().mockResolvedValue({ data: null });
  mutations.loading = { save: false, publish: false, discard: false };
  mutations.options = [];
}
