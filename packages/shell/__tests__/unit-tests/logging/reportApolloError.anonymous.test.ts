import { afterEach, describe, expect, it, vi } from 'vitest';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { reportApolloError } from '@/logging/reportApolloError';
import { portalLogger } from '@/logging/portalLogger';

vi.mock('@/logging/portalLogger', () => ({
  portalLogger: { error: vi.fn(), warn: vi.fn() },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('reportApolloError for an unnamed operation', () => {
  it('calls it anonymous when nobody gave it a name', () => {
    const failure = new Error('Failed to fetch');

    reportApolloError(failure, undefined);

    expect(portalLogger.warn).toHaveBeenCalledWith('GraphQL anonymous got no answer', failure, {
      operation: 'anonymous',
    });
  });

  it('ignores an error that carries no extensions at all', () => {
    reportApolloError(new CombinedGraphQLErrors({ errors: [{ message: 'Nope' }] }), 'ListBugs');

    expect(portalLogger.error).not.toHaveBeenCalled();
    expect(portalLogger.warn).not.toHaveBeenCalled();
  });
});
