import { randomUUID } from 'node:crypto';
import type { GraphQLFormattedError } from 'graphql';
import { unwrapResolverError } from '@apollo/server/errors';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { ORGANIZATION_FIELD } from '../lib/tenant';
import { ConfigurationError } from '../utils/errors';
import { UnsafeUrlError } from '../utils/safeFetch';
import { EmailRenderError } from '../modules/email/email.render';

/**
 * Codes whose message was written for the person using the portal — a refusal, a missing
 * record, bad input, a malformed or over-limit document (graphql-armor reports as validation
 * or parse failures) — so it reaches them unchanged in every environment.
 */
export const PUBLIC_ERROR_CODES = new Set([
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'BAD_USER_INPUT',
  'BAD_REQUEST',
  'GRAPHQL_VALIDATION_FAILED',
  'GRAPHQL_PARSE_FAILED',
  'PERSISTED_QUERY_NOT_FOUND',
  'OPERATION_RESOLUTION_FAILURE',
  'TOO_MANY_REQUESTS',
  'FAILED_PRECONDITION',
  // A website form's security check: the site shows a new question when it sees this.
  'CAPTCHA_FAILED',
]);

/** Mongo's duplicate-key code — a unique index refusing a second record. */
const DUPLICATE_KEY = 11000;

export const DUPLICATE_VALUE_MESSAGE = 'That value is already in use';
export const INTERNAL_ERROR_MESSAGE = 'Something went wrong';

function isDuplicateKey(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === DUPLICATE_KEY;
}

/**
 * Names the field a duplicate collided on — "That name is already in use" — never its value.
 * The organization is part of every scoped unique key but is not something a person chose.
 */
export function duplicateMessage(error: unknown): string {
  const keyPattern = (error as { keyPattern?: Record<string, unknown> } | null)?.keyPattern ?? {};
  const fields = Object.keys(keyPattern).filter((field) => field !== ORGANIZATION_FIELD);
  if (fields.length === 0) return DUPLICATE_VALUE_MESSAGE;
  return `That ${fields.join(' and ')} is already in use`;
}

/**
 * Errors thrown as plain `Error`s whose message was nonetheless written for a person: a schema
 * rule refusing a value, an email template that does not render, a URL that points inside our
 * network, an integration nobody has set up. They keep their message under a public code; a
 * cast failure names only the field, never the value it could not read.
 */
function explainedError(error: unknown): { message: string; code: string } | null {
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((issue) => issue.message);
    return { message: messages.join('; '), code: 'BAD_USER_INPUT' };
  }
  if (error instanceof mongoose.Error.CastError) {
    return { message: `Invalid value for ${error.path}`, code: 'BAD_USER_INPUT' };
  }
  if (error instanceof EmailRenderError || error instanceof UnsafeUrlError) {
    return { message: error.message, code: 'BAD_USER_INPUT' };
  }
  if (error instanceof ConfigurationError) {
    return { message: error.message, code: error.code };
  }
  return null;
}

/**
 * Builds Apollo's `formatError`. A duplicate key becomes a BAD_USER_INPUT without the key's
 * value (the raw E11000 message names the index and the value). In production anything
 * without a public code — a crashed resolver, a driver message naming a collection — is
 * replaced with a generic message and a correlation id; the original is logged under that id
 * so the one line a user reports finds the stack. Outside production messages stay as thrown.
 */
export function buildFormatError(production: boolean) {
  return (formatted: GraphQLFormattedError, error: unknown): GraphQLFormattedError => {
    const original = unwrapResolverError(error);
    if (isDuplicateKey(original)) {
      return {
        message: duplicateMessage(original),
        locations: formatted.locations,
        path: formatted.path,
        extensions: { code: 'BAD_USER_INPUT' },
      };
    }
    const explained = explainedError(original);
    if (explained) {
      return {
        message: explained.message,
        locations: formatted.locations,
        path: formatted.path,
        extensions: { code: explained.code },
      };
    }
    const code = formatted.extensions?.code;
    if (!production || (typeof code === 'string' && PUBLIC_ERROR_CODES.has(code))) {
      return formatted;
    }
    const correlationId = randomUUID();
    logger.error({ err: original, correlationId, path: formatted.path }, 'Unhandled GraphQL error');
    return {
      message: INTERNAL_ERROR_MESSAGE,
      locations: formatted.locations,
      path: formatted.path,
      extensions: { code: 'INTERNAL_SERVER_ERROR', correlationId },
    };
  };
}
