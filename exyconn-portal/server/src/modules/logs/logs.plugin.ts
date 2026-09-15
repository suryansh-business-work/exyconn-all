import type { ApolloServerPlugin } from '@apollo/server';
import type { GraphQLError } from 'graphql';
import { normalizeMessage, recordServerErrors, type LogEntryInput } from './logs.ingest';
import {
  EXPECTED_ERROR_CODES,
  MAX_SERVER_ERRORS_PER_REQUEST,
  type AppLogLevel,
} from './logs.constants';
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
 * The request's errors as log entries: identical ones folded into one (with its count), at
 * most MAX_SERVER_ERRORS_PER_REQUEST of them, and none of the expected refusals when nobody
 * is signed in. Each kept server fault also goes to pino — once, not once per repeat.
 */
export function foldRequestErrors(
  errors: readonly GraphQLError[],
  operationName: string | null | undefined,
  signedIn: boolean,
): LogEntryInput[] {
  const byKey = new Map<string, LogEntryInput>();
  for (const error of errors) {
    const expected = isExpected(error);
    if (expected && !signedIn) continue;
    const entry = toEntry(error, expected ? 'WARN' : 'ERROR', operationName);
    const key = [entry.level, entry.errorName, normalizeMessage(entry.message)].join('|');
    const seen = byKey.get(key);
    if (seen) {
      seen.count = (seen.count ?? 1) + 1;
    } else if (byKey.size < MAX_SERVER_ERRORS_PER_REQUEST) {
      if (!expected) {
        logger.error({ err: error.originalError ?? error, operationName }, entry.message);
      }
      byKey.set(key, entry);
    }
  }
  return [...byKey.values()];
}

/** Writes still in flight, so a test can wait for them; the request never does. */
const pendingWrites = new Set<Promise<void>>();

/** Test seam: resolves once every error log write started so far has finished. */
export async function settleServerErrorLogs(): Promise<void> {
  await Promise.all(pendingWrites);
}

/**
 * Sends every failed GraphQL answer to Tech > Logs, tagged with the operation and the
 * signed-in user. A server fault is an ERROR (and goes to pino); an expected refusal — a
 * wrong password, a missing permission, bad input (see `EXPECTED_ERROR_CODES`) — is a WARN
 * for a signed-in caller, so a failed action is still visible without reading as a bug.
 *
 * The write is not awaited: a response must not wait on, or be slowed by, its own logging.
 */
export const serverErrorLogPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    return {
      async didEncounterErrors({ errors, contextValue, operationName }) {
        const entries = foldRequestErrors(errors, operationName, contextValue.user !== null);
        if (entries.length === 0) {
          return;
        }
        const write = recordServerErrors(entries, {
          user: contextValue.user,
          ip: contextValue.ip,
          userAgent: contextValue.userAgent,
        })
          .catch((error: unknown) => {
            logger.error({ err: error }, 'Could not store a server error log');
          })
          .finally(() => pendingWrites.delete(write));
        pendingWrites.add(write);
      },
    };
  },
};
