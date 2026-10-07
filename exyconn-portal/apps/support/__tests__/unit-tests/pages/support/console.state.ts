import { vi } from 'vitest';

/** The console's queries and session, as both console test files' module mocks answer them. */
export const consoleGql = {
  stats: vi.fn(),
  sla: vi.fn(),
  refetchStats: vi.fn(),
  refetchSla: vi.fn(),
  user: { id: 'agent-7' } as null | { id: string },
};
