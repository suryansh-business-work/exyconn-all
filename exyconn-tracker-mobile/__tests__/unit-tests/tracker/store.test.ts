import { afterEach, describe, expect, it, vi } from 'vitest';

const STATE_URI = 'file:///document/tracker-state.json';
const TOKEN_KEY = 'exyconn.tracker.device-token';
/** Built at runtime: no credential-looking literal in source. */
const TOKEN = ['device', 'token', 'one'].join('-');

/**
 * The store is a singleton read from disk and the keychain on first use, so every case loads a
 * fresh module graph, seeds the in-memory disk/keychain it uses, then creates the store.
 */
async function load(seed: { state?: string; token?: string } = {}) {
  vi.resetModules();
  const fs = await import('../mocks/expo-file-system');
  const secure = await import('../mocks/expo-secure-store');
  fs.fileSystemTest.clear();
  secure.secureStoreTest.clear();
  if (seed.state !== undefined) {
    fs.fileSystemTest.files.set(STATE_URI, seed.state);
  }
  if (seed.token !== undefined) {
    secure.secureStoreTest.items.set(TOKEN_KEY, seed.token);
  }
  const { mobileStore } = await import('../../../src/tracker/store');
  return { fs, secure, store: mobileStore() };
}

function savedState(fs: { fileSystemTest: { files: Map<string, string> } }): unknown {
  return JSON.parse(fs.fileSystemTest.files.get(STATE_URI) ?? 'null');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mobileStore — first launch', () => {
  it('generates a device id and saves the default preferences', async () => {
    const { fs, store } = await load();
    expect(store.deviceId).toMatch(/^uuid-\d+$/);
    expect(store.preferences).toEqual({
      themeMode: 'system',
      muteCaptureSound: false,
      progressStyle: 'bar',
      transparentBackground: false,
      backgroundOpacity: 0.75,
    });
    expect(savedState(fs)).toMatchObject({ deviceId: store.deviceId });
    expect(store.getToken()).toBeNull();
    expect(store.remembered).toBe(false);
    expect(store.selectedProjectId).toBe('');
    expect(store.selectedTaskId).toBe('');
  });

  it('returns the same store on every call', async () => {
    const { store } = await load();
    const { mobileStore } = await import('../../../src/tracker/store');
    expect(mobileStore()).toBe(store);
  });

  it('starts fresh, and says so, when the saved state is corrupt', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { store } = await load({ state: '{not json' });
    expect(store.deviceId).toMatch(/^uuid-\d+$/);
    expect(error).toHaveBeenCalledWith(
      'Tracker state was unreadable; starting fresh',
      expect.any(SyntaxError),
    );
  });
});

describe('mobileStore — saved state', () => {
  it('reads the saved device, choices and selection, filling preference gaps with defaults', async () => {
    const state = JSON.stringify({
      deviceId: 'device-7',
      preferences: { themeMode: 'dark' },
      selectedProjectId: 'p1',
      selectedTaskId: 't1',
    });
    const { store } = await load({ state });
    expect(store.deviceId).toBe('device-7');
    expect(store.preferences).toMatchObject({ themeMode: 'dark', progressStyle: 'bar' });
    expect(store.selectedProjectId).toBe('p1');
    expect(store.selectedTaskId).toBe('t1');
  });

  it('treats a token found in the keychain as a remembered sign-in', async () => {
    const { store } = await load({ token: TOKEN });
    expect(store.getToken()).toBe(TOKEN);
    expect(store.remembered).toBe(true);
  });
});

describe('mobileStore — sign-in token', () => {
  it('keeps a remembered token in the keychain', async () => {
    const { secure, store } = await load();
    store.setToken(TOKEN, true);
    expect(store.getToken()).toBe(TOKEN);
    expect(store.remembered).toBe(true);
    expect(secure.secureStoreTest.items.get(TOKEN_KEY)).toBe(TOKEN);
  });

  it('holds an unremembered token in memory only, deleting any stored one', async () => {
    const { secure, store } = await load({ token: TOKEN });
    store.setToken('other', false);
    expect(store.getToken()).toBe('other');
    expect(store.remembered).toBe(false);
    await vi.waitFor(() => expect(secure.secureStoreTest.items.has(TOKEN_KEY)).toBe(false));
  });

  it('forgets the token on sign-out', async () => {
    const { secure, store } = await load({ token: TOKEN });
    store.clearToken();
    expect(store.getToken()).toBeNull();
    expect(store.remembered).toBe(false);
    await vi.waitFor(() => expect(secure.secureStoreTest.items.has(TOKEN_KEY)).toBe(false));
  });

  it('logs, rather than throws, when the keychain refuses the delete', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { secure, store } = await load({ token: TOKEN });
    vi.mocked(secure.deleteItemAsync).mockRejectedValueOnce(new Error('keychain locked'));
    store.clearToken();
    expect(store.getToken()).toBeNull();
    await vi.waitFor(() =>
      expect(error).toHaveBeenCalledWith('Could not remove the stored sign-in', expect.any(Error)),
    );
  });
});

describe('mobileStore — choices', () => {
  it('merges and saves a preference change', async () => {
    const { fs, store } = await load();
    const next = store.setPreferences({ muteCaptureSound: true });
    expect(next.muteCaptureSound).toBe(true);
    expect(next.themeMode).toBe('system');
    expect(savedState(fs)).toMatchObject({ preferences: { muteCaptureSound: true } });
  });

  it('forgets the ticket when the project changes', async () => {
    const { fs, store } = await load();
    store.setSelectedTask('t1');
    store.setSelectedProject('p2');
    expect(store.selectedProjectId).toBe('p2');
    expect(store.selectedTaskId).toBe('');
    store.setSelectedTask('t9');
    expect(savedState(fs)).toMatchObject({ selectedProjectId: 'p2', selectedTaskId: 't9' });
  });

  it('keeps a change in memory when the disk write fails, and logs it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { fs, store } = await load();
    vi.spyOn(fs.File.prototype, 'write').mockImplementation(() => {
      throw new Error('disk full');
    });
    expect(() => store.setSelectedProject('p3')).not.toThrow();
    expect(store.selectedProjectId).toBe('p3');
    expect(error).toHaveBeenCalledWith('Could not save the tracker state', expect.any(Error));
  });
});
