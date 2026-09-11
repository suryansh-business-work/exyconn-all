import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { portalLogger } from './portalLogger';

/** The report call itself: its failure is not reported, or one outage would loop forever. */
const REPORT_OPERATION = 'ReportClientLogs';

/**
 * Codes that mean THIS bundle asked for something the API does not serve — a stale deploy or a
 * query bug. Resolver faults are logged by the server itself (source SERVER), and the rest
 * (UNAUTHENTICATED, BAD_USER_INPUT, …) are the API answering correctly.
 */
const CLIENT_FAULT_CODES = new Set(['GRAPHQL_VALIDATION_FAILED', 'GRAPHQL_PARSE_FAILED']);

/** What the portal alone can see about a failed request: its own bad query, or no answer. */
export function reportApolloError(error: unknown, operationName: string | undefined): void {
  if (operationName === REPORT_OPERATION) {
    return;
  }
  const operation = operationName ?? 'anonymous';
  if (!CombinedGraphQLErrors.is(error)) {
    portalLogger.warn(`GraphQL ${operation} got no answer`, error, { operation });
    return;
  }
  for (const graphQLError of error.errors) {
    const code = graphQLError.extensions?.code;
    if (typeof code === 'string' && CLIENT_FAULT_CODES.has(code)) {
      portalLogger.error(`GraphQL ${operation} was rejected`, graphQLError, { operation, code });
    }
  }
}
