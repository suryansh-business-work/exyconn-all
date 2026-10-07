import { beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { paths, keychain } = vi.hoisted(() => ({
  paths: { userData: '' },
  keychain: { available: true, decryptFails: false },
}));

vi.mock('electron', () => ({
  app: { getPath: () => paths.userData },
  safeStorage: {
    isEncryptionAvailable: () => keychain.available,
    encryptString: (text: string) => Buffer.from(`sealed:${text}`),
    decryptString: (sealed: Buffer) => {
      if (keychain.decryptFails) {
        throw new Error('keychain locked');
      }
      return sealed.toString().replace('sealed:', '');
    },
  },
}));

/** Built only from parts, so no credential-looking literal sits in the source. */
const TOKEN = ['device', 'token', String(Date.now())].join('-');

/** A fresh process: the store is a lazily built singleton. */
async function launch() {
  vi.resetModules();
  const { secureStore } = await import('../../../src/main/store');
  return secureStore();
}

const stateFile = () => join(paths.userData, 'tracker-state.json');
const onDisk = () => JSON.parse(readFileSync(stateFile(), 'utf-8')) as Record<string, unknown>;

beforeEach(() => {
  // A userData folder that does not exist yet: the first write has to create it.
  paths.userData = join(mkdtempSync(join(tmpdir(), 'store-')), 'userData');
  keychain.available = true;
  keychain.decryptFails = false;
});

describe('a fresh install', () => {
  it('has a device id, no sign-in, and the default preferences', async () => {
    const store = await launch();

    expect(store.deviceId).toMatch(/^[\da-f-]{36}$/);
    expect(store.remembered).toBe(false);
    expect(store.getToken()).toBeNull();
    expect(store.preferences).toEqual({
      closeToTray: true,
      themeMode: 'system',
      muteCaptureSound: false,
      progressStyle: 'bar',
      updateAutomatically: true,
      transparentBackground: false,
      backgroundOpacity: 0.75,
    });
    expect(store.selectedProjectId).toBe('');
    expect(store.selectedTaskId).toBe('');
    expect(existsSync(stateFile())).toBe(false);
  });

  it('is one store per process', async () => {
    vi.resetModules();
    const { secureStore } = await import('../../../src/main/store');

    expect(secureStore()).toBe(secureStore());
  });

  it('starts fresh instead of crashing on a corrupt state file', async () => {
    mkdirSync(paths.userData, { recursive: true });
    writeFileSync(stateFile(), '{not json', 'utf-8');

    const store = await launch();

    expect(store.remembered).toBe(false);
    expect(store.deviceId).toMatch(/^[\da-f-]{36}$/);
  });
});

describe('remembered sign-in', () => {
  it('keeps the token encrypted on disk and brings it back next launch', async () => {
    const store = await launch();
    store.setToken(TOKEN, true);

    expect(store.remembered).toBe(true);
    expect(store.getToken()).toBe(TOKEN);
    expect(readFileSync(stateFile(), 'utf-8')).not.toContain(TOKEN);
    expect(onDisk().encryptedToken).toBe(Buffer.from(`sealed:${TOKEN}`).toString('base64'));

    const relaunched = await launch();
    expect(relaunched.deviceId).toBe(store.deviceId);
    expect(relaunched.getToken()).toBe(TOKEN);
  });

  it('refuses to remember a sign-in without OS secure storage', async () => {
    keychain.available = false;
    const store = await launch();

    expect(() => store.setToken(TOKEN, true)).toThrow(/secure storage is unavailable/);
    expect(store.remembered).toBe(false);
  });

  it('reads no token when the keychain is unavailable or cannot decrypt', async () => {
    const store = await launch();
    store.setToken(TOKEN, true);

    keychain.available = false;
    expect(store.getToken()).toBeNull();

    keychain.available = true;
    keychain.decryptFails = true;
    expect(store.getToken()).toBeNull();
  });

  it('forgets everything on sign-out', async () => {
    const store = await launch();
    store.setToken(TOKEN, true);

    store.clearToken();

    expect(store.remembered).toBe(false);
    expect(store.getToken()).toBeNull();
    expect(onDisk().encryptedToken).toBeNull();
  });
});

describe('session-only sign-in', () => {
  it('holds the token in memory only, so a restart signs the employee out', async () => {
    const store = await launch();
    store.setToken(TOKEN, true);

    store.setToken(TOKEN, false);

    expect(store.getToken()).toBe(TOKEN);
    expect(store.remembered).toBe(false);
    expect(onDisk().encryptedToken).toBeNull();
    expect((await launch()).getToken()).toBeNull();
  });

  it('a later remembered sign-in replaces the in-memory one', async () => {
    const store = await launch();
    store.setToken('first-session', false);

    store.setToken(TOKEN, true);
    keychain.available = false;

    expect(store.getToken()).toBeNull();
  });
});

describe('preferences', () => {
  it('fills defaults in for a state file written before a preference existed', async () => {
    mkdirSync(paths.userData, { recursive: true });
    writeFileSync(
      stateFile(),
      JSON.stringify({
        encryptedToken: null,
        deviceId: 'old-device',
        preferences: { closeToTray: false },
      }),
      'utf-8',
    );

    const store = await launch();

    expect(store.deviceId).toBe('old-device');
    expect(store.preferences).toMatchObject({ closeToTray: false, themeMode: 'system' });
  });

  it('merges an update over what is there and persists the whole set', async () => {
    const store = await launch();

    const saved = store.setPreferences({ themeMode: 'dark', muteCaptureSound: true });

    expect(saved).toMatchObject({ themeMode: 'dark', muteCaptureSound: true, closeToTray: true });
    expect((await launch()).preferences).toEqual(saved);
  });
});

describe('project and ticket', () => {
  it('remembers the pick, and drops the ticket when the project changes', async () => {
    const store = await launch();

    store.setSelectedProject('p1');
    store.setSelectedTask('t1');
    expect(store.selectedProjectId).toBe('p1');
    expect(store.selectedTaskId).toBe('t1');
    expect((await launch()).selectedTaskId).toBe('t1');

    store.setSelectedProject('p2');
    expect(store.selectedProjectId).toBe('p2');
    expect(store.selectedTaskId).toBe('');
  });
});
