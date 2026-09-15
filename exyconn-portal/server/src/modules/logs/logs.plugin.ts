import type { ApolloServerPlugin } from '@apollo/server';
import type { GraphQLError } from 'graphql';
import { recordServerErrors, type LogEntryInput } from './logs.ingest';
import { EXPECTED_ERROR_CODES, type AppLogLevel } from './logs.constants';
import { logger } from '../../utils/logger';
import type { GraphQLContext } from '../../middleware/auth';

function isExpected(error: GraphQLError): boolean {
  const code = error.extensions?.code;
  return typeof code === 'string' && EXPECTED_ERROR_CODES.has(code);
}

/**
 * graphql-js repeats a rejected variable's value in the message ("got invalid value …;"),
 * and that value can be a password — keep the sentence, drop the value.
 */
export function withoutVariableValues(message: string): string {
  return message.replaceAll(/got invalid value [^;]*/g, 'got an invalid value');
}

function toEntry(
  error: GraphQLError,
  level: AppLogLevel,
  operationName: string | null | undefined,
): LogEntryInput {
  const cause = error.originalError ?? error;
  return {
    level,
    message: withoutVariableValues(error.message),
    errorName: cause.name,
    stack: cause.stack ?? null,
    route: operationName ?? 'anonymous operation',
    // The path and code only: variables can hold passwords and tokens.
    context: JSON.stringify({ path: error.path ?? [], code: error.extensions?.code ?? null }),
    occurredAt: new Date(),
  };
}

/**
 * Sends every failed GraphQL answer to Tech > Logs, tagged with the operation and the
 * signed-in user. A server fault is an ERROR (and goes to pino); an expected refusal — a
 * wrong password, a missing permission, bad input (see `EXPECTED_ERROR_CODES`) — is a WARN,
 * so a failed sign-in is still visible without reading as a bug.
 */
export const serverErrorLogPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    return {
      async didEncounterErrors({ errors, contextValue, operationName }) {
        const entries = errors.map((error) => {
          if (isExpected(error)) {
            return toEntry(error, 'WARN', operationName);
          }
          logger.error({ err: error.originalError ?? error, operationName }, error.message);
          return toEntry(error, 'ERROR', operationName);
        });
        await recordServerErrors(entries, {
          user: contextValue.user,
          ip: contextValue.ip,
          userAgent: contextValue.userAgent,
        });
      },
    };
  },
};
