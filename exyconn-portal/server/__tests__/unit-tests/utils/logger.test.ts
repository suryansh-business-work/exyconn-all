import { Writable } from 'node:stream';
import pino from 'pino';
import { LOG_REDACTION, REDACTED_PATHS, logger } from '../../../src/utils/logger';

/** A pino instance with the app's redaction, writing into a string. */
function captureLogger() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, done) {
      lines.push(String(chunk));
      done();
    },
  });
  return { log: pino({ redact: LOG_REDACTION }, stream), lines };
}

describe('log redaction', () => {
  it('censors credentials at the top level and one level down', () => {
    const { log, lines } = captureLogger();
    const credential = `cred-${Date.now()}`;
    log.info({ password: credential, input: { token: credential, name: 'Asha' } }, 'signed in');
    const written = JSON.parse(lines[0]);
    expect(written.password).toBe('[redacted]');
    expect(written.input.token).toBe('[redacted]');
    expect(written.input.name).toBe('Asha');
    expect(lines[0]).not.toContain(credential);
  });

  it('censors session headers on a logged request', () => {
    const { log, lines } = captureLogger();
    log.info({ req: { headers: { authorization: 'Bearer abc', cookie: 'sid=1', host: 'x' } } });
    const written = JSON.parse(lines[0]);
    expect(written.req.headers.authorization).toBe('[redacted]');
    expect(written.req.headers.cookie).toBe('[redacted]');
    expect(written.req.headers.host).toBe('x');
  });

  it('exports the paths and censor the app logger uses', () => {
    expect(LOG_REDACTION).toEqual({ paths: REDACTED_PATHS, censor: '[redacted]' });
    expect(REDACTED_PATHS).toEqual(expect.arrayContaining(['password', '*.secret']));
    expect(typeof logger.info).toBe('function');
  });
});

function loadWith(isProduction: boolean) {
  const factory = jest.fn((_options: unknown) => ({ info: jest.fn() }));
  jest.isolateModules(() => {
    jest.doMock('pino', () => factory);
    jest.doMock('../../../src/config/env', () => ({ env: { isProduction } }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../../../src/utils/logger');
  });
  return factory.mock.calls[0];
}

describe('logger configuration', () => {
  afterEach(() => {
    jest.dontMock('pino');
    jest.dontMock('../../../src/config/env');
  });

  it('logs at info as plain JSON in production', () => {
    const [options] = loadWith(true);
    expect(options).toEqual({ level: 'info', redact: LOG_REDACTION, transport: undefined });
  });

  it('logs at debug through pino-pretty everywhere else', () => {
    const [options] = loadWith(false);
    expect(options).toEqual({
      level: 'debug',
      redact: LOG_REDACTION,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      },
    });
  });
});
