import {
  MIN_JWT_SECRET_LENGTH,
  PLACEHOLDER_JWT_SECRETS,
  validateEnvironment,
} from '../../../src/config/env';
import { loadEnv, secret } from './loadEnv';

jest.mock('dotenv', () => ({ config: jest.fn() }));

let stderr: jest.SpyInstance;
beforeEach(() => {
  stderr = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => stderr.mockRestore());

describe('validateEnvironment outside production', () => {
  it('accepts a named non-production environment without warnings', () => {
    const report = validateEnvironment({
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://localhost/x',
      JWT_SECRET: secret(16),
    });
    expect(report.warnings).toEqual([]);
    expect(report.values.NODE_ENV).toBe('test');
  });

  it('names every missing required variable at once', () => {
    expect(() => validateEnvironment({})).toThrow(
      'Missing required environment variable: MONGODB_URI; Missing required environment variable: JWT_SECRET',
    );
  });
});

describe('validateEnvironment in production', () => {
  const base = { NODE_ENV: 'production', MONGODB_URI: 'mongodb://db/x' };

  it('refuses a CORS list made only of blanks', () => {
    expect(() =>
      validateEnvironment({ ...base, JWT_SECRET: secret(32), CORS_ORIGIN: ' , ' }),
    ).toThrow('CORS_ORIGIN must list the portal origins in production');
  });

  it('accepts a secret of exactly the minimum length', () => {
    const exact = secret(MIN_JWT_SECRET_LENGTH / 2);
    expect(exact).toHaveLength(MIN_JWT_SECRET_LENGTH);
    const report = validateEnvironment({
      ...base,
      JWT_SECRET: exact,
      CORS_ORIGIN: 'https://a.test',
    });
    expect(report.warnings).toEqual([]);
  });
});

describe('the env singleton warnings', () => {
  it('treats an empty seed password as no password', () => {
    expect(
      loadEnv({ NODE_ENV: 'test', SEED_ADMIN_PASSWORD: '' }).env.seedAdmin.password,
    ).toBeNull();
  });

  it('defaults to development and says so when NODE_ENV is unset', () => {
    const { env } = loadEnv({ NODE_ENV: undefined });
    expect(env.nodeEnv).toBe('development');
    expect(env.isProduction).toBe(false);
    expect(stderr).toHaveBeenCalledWith(expect.stringContaining('[env] NODE_ENV is not set'));
  });

  it('boots production with a short secret and prints the warning', () => {
    const { env } = loadEnv({
      NODE_ENV: 'production',
      JWT_SECRET: secret(8),
      CORS_ORIGIN: 'https://portal.test',
    });
    expect(env.isProduction).toBe(true);
    expect(env.nodeEnv).toBe('production');
    expect(stderr).toHaveBeenCalledWith(expect.stringContaining('[env] JWT_SECRET is shorter'));
  });

  it('refuses to load at all with a forgeable production secret', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        JWT_SECRET: [...PLACEHOLDER_JWT_SECRETS][0],
        CORS_ORIGIN: 'https://p.test',
      }),
    ).toThrow(/published placeholder/);
  });
});
