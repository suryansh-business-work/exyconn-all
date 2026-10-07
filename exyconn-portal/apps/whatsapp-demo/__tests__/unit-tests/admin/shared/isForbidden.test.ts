import { describe, expect, it } from 'vitest';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { isForbidden } from '../../../../src/admin/shared/isForbidden';

const graphQLError = (code?: string) =>
  new CombinedGraphQLErrors({
    errors: [
      { message: 'Something else' },
      { message: 'Nope', extensions: code ? { code } : undefined },
    ],
  });

describe('isForbidden', () => {
  it('is true when any GraphQL error carries FORBIDDEN', () => {
    expect(isForbidden(graphQLError('FORBIDDEN'))).toBe(true);
  });

  it('is false for other GraphQL error codes and for errors with no code', () => {
    expect(isForbidden(graphQLError('UNAUTHENTICATED'))).toBe(false);
    expect(isForbidden(graphQLError())).toBe(false);
  });

  it('is false for anything that is not a GraphQL error', () => {
    expect(isForbidden(new Error('FORBIDDEN'))).toBe(false);
    expect(isForbidden({ errors: [{ extensions: { code: 'FORBIDDEN' } }] })).toBe(false);
    expect(isForbidden(null)).toBe(false);
  });
});
