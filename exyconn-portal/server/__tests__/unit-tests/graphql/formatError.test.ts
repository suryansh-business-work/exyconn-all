import mongoose from 'mongoose';
import type { GraphQLFormattedError } from 'graphql';
import {
  DUPLICATE_VALUE_MESSAGE,
  INTERNAL_ERROR_MESSAGE,
  PUBLIC_ERROR_CODES,
  buildFormatError,
  duplicateMessage,
} from '../../../src/graphql/formatError';
import { ConfigurationError } from '../../../src/utils/errors';
import { UnsafeUrlError } from '../../../src/utils/safeFetch';
import { EmailRenderError } from '../../../src/modules/email/email.render';
import { logger } from '../../../src/utils/logger';

jest.mock('../../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const formatted = (code?: unknown): GraphQLFormattedError => ({
  message: 'raw message',
  locations: [{ line: 1, column: 3 }],
  path: ['field'],
  ...(code === undefined ? {} : { extensions: { code } }),
});

const production = buildFormatError(true);
const development = buildFormatError(false);

describe('duplicateMessage', () => {
  it('names the fields that collided, leaving out the organization', () => {
    expect(duplicateMessage({ keyPattern: { organizationId: 1, name: 1 } })).toBe(
      'That name is already in use',
    );
    expect(duplicateMessage({ keyPattern: { code: 1, year: 1 } })).toBe(
      'That code and year is already in use',
    );
  });

  it('falls back to a generic sentence when no person-chosen field is known', () => {
    expect(duplicateMessage({ keyPattern: { organizationId: 1 } })).toBe(DUPLICATE_VALUE_MESSAGE);
    expect(duplicateMessage({})).toBe(DUPLICATE_VALUE_MESSAGE);
    expect(duplicateMessage(null)).toBe(DUPLICATE_VALUE_MESSAGE);
  });
});

describe('buildFormatError', () => {
  it('turns a duplicate key into bad input in every environment', () => {
    const error = { code: 11000, keyPattern: { email: 1 }, message: 'E11000 dup key: a@b.c' };
    for (const format of [production, development]) {
      expect(format(formatted('INTERNAL_SERVER_ERROR'), error)).toEqual({
        message: 'That email is already in use',
        locations: [{ line: 1, column: 3 }],
        path: ['field'],
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
  });

  it('joins every schema validation message', () => {
    const error = new mongoose.Error.ValidationError();
    error.addError(
      'name',
      new mongoose.Error.ValidatorError({ message: 'Name is required', path: 'name' }),
    );
    error.addError(
      'amount',
      new mongoose.Error.ValidatorError({ message: 'Amount must be positive', path: 'amount' }),
    );
    expect(production(formatted(), error)).toMatchObject({
      message: 'Name is required; Amount must be positive',
      extensions: { code: 'BAD_USER_INPUT' },
    });
  });

  it('names the field of a cast failure, never the value', () => {
    const error = new mongoose.Error.CastError('ObjectId', 'not-an-id', 'employeeId');
    const result = production(formatted(), error);
    expect(result.message).toBe('Invalid value for employeeId');
    expect(result.message).not.toContain('not-an-id');
    expect(result.extensions).toEqual({ code: 'BAD_USER_INPUT' });
  });

  it.each([
    ['a template that will not render', new EmailRenderError('Template "x" has a syntax error')],
    ['a URL inside the network', new UnsafeUrlError('That address is not allowed')],
  ])('keeps the message of %s as bad input', (_label, error) => {
    expect(production(formatted(), error)).toMatchObject({
      message: error.message,
      extensions: { code: 'BAD_USER_INPUT' },
    });
  });

  it('keeps a missing-integration message under its precondition code', () => {
    const error = new ConfigurationError('Add an email configuration in Tech first');
    expect(production(formatted(), error)).toMatchObject({
      message: 'Add an email configuration in Tech first',
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  });

  it('passes every public code through unchanged in production', () => {
    for (const code of PUBLIC_ERROR_CODES) {
      const shape = formatted(code);
      expect(production(shape, new Error('boom'))).toBe(shape);
    }
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('keeps anything as thrown outside production', () => {
    const shape = formatted('INTERNAL_SERVER_ERROR');
    expect(development(shape, new Error('driver said collection x'))).toBe(shape);
  });

  it.each([
    ['an internal code', 'INTERNAL_SERVER_ERROR'],
    ['no code at all', undefined],
    ['a code that is not a string', 42],
  ])('hides %s behind a correlation id in production', (_label, code) => {
    const original = new Error('driver said collection secrets');
    const result = production(formatted(code), original);
    const correlationId = result.extensions?.correlationId;
    expect(result.message).toBe(INTERNAL_ERROR_MESSAGE);
    expect(result.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
    expect(typeof correlationId).toBe('string');
    expect(result.path).toEqual(['field']);
    expect(logger.error).toHaveBeenCalledWith(
      { err: original, correlationId, path: ['field'] },
      'Unhandled GraphQL error',
    );
  });
});
