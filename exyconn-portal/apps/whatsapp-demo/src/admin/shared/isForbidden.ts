import { CombinedGraphQLErrors } from '@apollo/client/errors';

/**
 * True when the server refused the request for lack of a role.
 *
 * The admin area hides itself from non-admins, but the server is the authority: a role
 * revoked mid-session still answers FORBIDDEN, and that deserves the refusal screen rather
 * than a generic "could not load".
 */
export function isForbidden(error: unknown): boolean {
  return (
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((graphQLError) => graphQLError.extensions?.code === 'FORBIDDEN')
  );
}
