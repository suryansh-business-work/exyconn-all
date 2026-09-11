import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { reportApolloError } from '@/logging/reportApolloError';
import { portalLogger } from '@/logging/portalLogger';

vi.mock('@/logging/portalLogger', () => ({
  portalLogger: { error: vi.fn(), warn: vi.fn() },
}));

const graphQLErrors = (code: string) =>
  new CombinedGraphQLErrors({ errors: [{ message: 'Nope', extensions: { code } }] });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reportApolloError', () => {
  it('reports a query the API refused to validate — this bundle is out of step', () => {
    reportApolloError(graphQLErrors('GRAPHQL_VALIDATION_FAILED'), 'ListBugs');
    expect(portalLogger.error).toHaveBeenCalledWith(
      'GraphQL ListBugs was rejected',
      expect.objectContaining({ message: 'Nope' }),
      { operation: 'ListBugs', code: 'GRAPHQL_VALIDATION_FAILED' },
    );
  });

  it('leaves errors that are the API answering correctly, or that the server logs itself', () => {
    reportApolloError(graphQLErrors('UNAUTHENTICATED'), 'Me');
    reportApolloError(graphQLErrors('INTERNAL_SERVER_ERROR'), 'Me');
    expect(portalLogger.error).not.toHaveBeenCalled();
  });

  it('warns when a request got no answer at all', () => {
    reportApolloError(new TypeError('Failed to fetch'), 'Me');
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'GraphQL Me got no answer',
      expect.any(TypeError),
      { operation: 'Me' },
    );
  });

  it('never reports the failure of the report itself', () => {
    reportApolloError(new TypeError('Failed to fetch'), 'ReportClientLogs');
    expect(portalLogger.warn).not.toHaveBeenCalled();
  });
});
