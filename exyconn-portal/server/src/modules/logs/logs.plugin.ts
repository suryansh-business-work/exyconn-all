import type { ApolloServerPlugin } from '@apollo/server';
import type { GraphQLError } from 'graphql';
import { recordServerErrors, type LogEntryInput } from './logs.ingest';
import { EXPECTED_ERROR_CODES } from './logs.constants';
import { logger } from '../../utils/logger';
import type { GraphQLContext } from '../../middleware/auth';

function isUnexpected(error: GraphQLError): boolean {
  const code = error.extensions?.code;
  return typeof code !== 'string' || !EXPECTED_ERROR_CODES.has(code);
}

function toEntry(error: GraphQLError, operationName: string | null | undefined): LogEntryInput {
  const cause = error.originalError ?? error;
  return {
    level: 'ERROR',
    message: error.message,
    errorName: cause.name,
    stack: cause.stack ?? null,
    route: operationName ?? 'anonymous operation',
    // The path only: variables can hold passwords and tokens.
    context: JSON.stringify({ path: error.path ?? [] }),
    occurredAt: new Date(),
  };
}

/**
 * Sends every resolver error that is not an expected answer (see `EXPECTED_ERROR_CODES`)
 * to pino and to Tech > Logs, tagged with the operation and the signed-in user.
 */
export const serverErrorLogPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    return {
      async didEncounterErrors({ errors, contextValue, operationName }) {
        const unexpected = errors.filter(isUnexpected);
        if (unexpected.length === 0) {
          return;
        }
        for (const error of unexpected) {
          logger.error({ err: error.originalError ?? error, operationName }, error.message);
        }
        await recordServerErrors(
          unexpected.map((error) => toEntry(error, operationName)),
          { user: contextValue.user, ip: contextValue.ip, userAgent: contextValue.userAgent },
        );
      },
    };
  },
};
