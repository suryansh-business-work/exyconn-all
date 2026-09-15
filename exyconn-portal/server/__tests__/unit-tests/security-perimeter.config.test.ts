import { randomBytes } from 'node:crypto';
import { Writable } from 'node:stream';
import pino from 'pino';
import { GraphQLError } from 'graphql';
import {
  MIN_JWT_SECRET_LENGTH,
  PLACEHOLDER_JWT_SECRETS,
  validateEnvironment,
} from '../../src/config/env';
import {
  DUPLICATE_VALUE_MESSAGE,
  INTERNAL_ERROR_MESSAGE,
  buildFormatError,
} from '../../src/graphql/formatError';
import { LOG_REDACTION } from '../../src/utils/logger';
import { maskEmail } from '../../src/utils/maskEmail';

/** A secret nobody has seen, generated per run so none lives in the test. */
const strongSecret = () => randomBytes(MIN_JWT_SECRET_LENGTH).toString('hex');

function productionEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb://db/exyconn',
    JWT_SECRET: strongSecret(),
    CORS_ORIGIN: 'https://portal.exyconn.com,https://admin.exyconn.com',
    ...overrides,
  };
}

describe('environment validation', () => {
  it('accepts a production environment with a long secret and an exact origin list', () => {
    expect(validateEnvironment(productionEnv()).warnings).toEqual([]);
  });

  it.each([...PLACEHOLDER_JWT_SECRETS])(
    'refuses to boot production with JWT_SECRET=%s',
    (secret) => {
      expect(() => validateEnvironment(productionEnv({ JWT_SECRET: secret }))).toThrow(
        /placeholder/,
      );
    },
  );

  it('refuses a wildcard or missing CORS list in production', () => {
    expect(() =>
      validateEnvironment(productionEnv({ CORS_ORIGIN: 'https://portal.exyconn.com, *' })),
    ).toThrow(/'\*'/);
    expect(() => validateEnvironment(productionEnv({ CORS_ORIGIN: undefined }))).toThrow(
      /CORS_ORIGIN/,
    );
  });

  it('boots production with a short secret, but says so', () => {
    const { warnings } = validateEnvironment(productionEnv({ JWT_SECRET: 'short-but-unknown' }));
    expect(warnings).toEqual([expect.stringContaining('JWT_SECRET is shorter')]);
  });

  it('names a missing required variable', () => {
    expect(() => validateEnvironment(productionEnv({ MONGODB_URI: '' }))).toThrow(
      'Missing required environment variable: MONGODB_URI',
    );
  });

  it('warns when NODE_ENV is unset, and allows development placeholders', () => {
    const { warnings } = validateEnvironment({
      MONGODB_URI: 'mongodb://localhost/exyconn',
      JWT_SECRET: 'change-me-in-production',
    });
    expect(warnings).toEqual([expect.stringContaining('NODE_ENV is not set')]);
  });
});

describe('formatError', () => {
  const formatted = (error: GraphQLError) => ({
    message: error.message,
    path: ['createThing'],
    extensions: { ...error.extensions, code: error.extensions.code ?? 'INTERNAL_SERVER_ERROR' },
  });
  const resolverError = (original: Error) =>
    new GraphQLError(original.message, { originalError: original, path: ['createThing'] });

  it('hides an unexpected error in production behind a correlation id', () => {
    const error = resolverError(new Error('connection to mongodb://10.0.0.4 lost'));
    const result = buildFormatError(true)(formatted(error), error);
    expect(result.message).toBe(INTERNAL_ERROR_MESSAGE);
    expect(result.extensions).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      correlationId: expect.stringMatching(/^[\da-f-]{36}$/),
    });
  });

  it.each(['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND', 'BAD_USER_INPUT', 'TOO_MANY_REQUESTS'])(
    'passes a %s message through in production',
    (code) => {
      const error = new GraphQLError('Invoice not found', { extensions: { code } });
      expect(buildFormatError(true)(formatted(error), error).message).toBe('Invoice not found');
    },
  );

  it('turns a duplicate key into bad input without the value', () => {
    const duplicate = Object.assign(
      new Error(
        'E11000 duplicate key error collection: users index: email_1 dup key: { email: "a@x.com" }',
      ),
      { code: 11000 },
    );
    const error = resolverError(duplicate);
    for (const production of [true, false]) {
      const result = buildFormatError(production)(formatted(error), error);
      expect(result).toMatchObject({
        message: DUPLICATE_VALUE_MESSAGE,
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
  });

  it('keeps the original message outside production', () => {
    const error = resolverError(new Error('Cannot read properties of undefined'));
    expect(buildFormatError(false)(formatted(error), error).message).toBe(
      'Cannot read properties of undefined',
    );
  });
});

describe('log redaction', () => {
  it('blanks credentials in headers and in logged objects', () => {
    const lines: string[] = [];
    const sink = new Writable({
      write(chunk: Buffer, _encoding, done) {
        lines.push(chunk.toString());
        done();
      },
    });
    const secret = strongSecret();
    pino({ redact: LOG_REDACTION }, sink).info(
      {
        req: {
          headers: { authorization: `Bearer ${secret}`, cookie: secret, 'x-api-key': secret },
        },
        input: { password: secret, email: 'a@x.com' },
        config: { botToken: secret, privateKey: secret },
      },
      'request',
    );
    expect(lines.join('')).not.toContain(secret);
    expect(lines.join('')).toContain('a@x.com');
  });

  it('masks a recipient address', () => {
    expect(maskEmail('asha.rao@exyconn.com')).toBe('as******@exyconn.com');
  });
});
