import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadEnv() {
  vi.resetModules();
  return (await import('../../../src/runtime/env.js')).env;
}

describe('the voice server settings', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads the port, database and public address, without a trailing slash', async () => {
    vi.stubEnv('PORT', '5050');
    vi.stubEnv('PUBLIC_URL', 'https://voice.example/api/');
    const env = await loadEnv();
    expect(env).toEqual({
      port: 5050,
      mongoUri: 'mongodb://voice.test/calls',
      publicUrl: 'https://voice.example/api',
    });
    expect(Object.isFrozen(env)).toBe(true);
  });

  it('falls back to the default port and public address', async () => {
    vi.stubEnv('PORT', undefined);
    vi.stubEnv('PUBLIC_URL', undefined);
    const env = await loadEnv();
    expect(env.port).toBe(4042);
    expect(env.publicUrl).toBe('https://demos.exyconn.com/calling-bot-demo/api');
  });

  it('refuses to start without a database address', async () => {
    vi.stubEnv('MONGODB_URI', '');
    await expect(loadEnv()).rejects.toThrow('MONGODB_URI is not set');
  });
});
