import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAppRequestHeaders } from '@/config/apolloClient';
import { createAppPass } from '@/auth/appPass';

vi.mock('@/config/apolloClient', () => ({ setAppRequestHeaders: vi.fn() }));

const STORAGE_KEY = 'demo.pass';
const HEADER = 'x-demo-visitor';

let passCounter = 0;
/** A fresh, non-secret pass value per call. */
function makePass(): string {
  passCounter += 1;
  return ['pass', passCounter].join('-');
}

/** The header provider the most recent `install()` registered. */
function installedHeaders(): () => Record<string, string> {
  const calls = vi.mocked(setAppRequestHeaders).mock.calls;
  return calls[calls.length - 1][0];
}

beforeEach(() => {
  vi.mocked(setAppRequestHeaders).mockClear();
  globalThis.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createAppPass storage', () => {
  it('stores, reports and clears the pass under its own key', () => {
    const pass = createAppPass({ storageKey: STORAGE_KEY, header: HEADER });
    expect(pass.has()).toBe(false);

    const value = makePass();
    pass.store(value);
    expect(pass.has()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(value);

    pass.clear();
    expect(pass.has()).toBe(false);
  });

  it('reports no pass when storage cannot be read', () => {
    localStorage.setItem(STORAGE_KEY, makePass());
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(createAppPass({ storageKey: STORAGE_KEY, header: HEADER }).has()).toBe(false);
  });

  it('logs instead of throwing when storage refuses a write or a removal', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const pass = createAppPass({ storageKey: STORAGE_KEY, header: HEADER });

    expect(() => pass.store(makePass())).not.toThrow();
    expect(() => pass.clear()).not.toThrow();
    expect(logged).toHaveBeenCalledWith('Could not keep the pass', expect.any(Error));
    expect(logged).toHaveBeenCalledWith('Could not clear the pass', expect.any(Error));
  });
});

describe('createAppPass install', () => {
  it('sends the stored pass in its header and nothing once it is cleared', () => {
    const pass = createAppPass({ storageKey: STORAGE_KEY, header: HEADER });
    pass.install();
    const headers = installedHeaders();
    expect(headers()).toEqual({});

    const value = makePass();
    pass.store(value);
    expect(headers()).toEqual({ [HEADER]: value });

    pass.clear();
    expect(headers()).toEqual({});
  });

  it('adopts a pass handed over in the address fragment and wipes it from the URL', () => {
    const value = makePass();
    globalThis.history.replaceState(null, '', `/chats?tab=open#demo=${value}`);
    const pass = createAppPass({ storageKey: STORAGE_KEY, header: HEADER, fragmentKey: 'demo' });

    pass.install();

    expect(localStorage.getItem(STORAGE_KEY)).toBe(value);
    expect(globalThis.location.pathname).toBe('/chats');
    expect(globalThis.location.search).toBe('?tab=open');
    expect(globalThis.location.hash).toBe('');
    expect(installedHeaders()()).toEqual({ [HEADER]: value });
  });

  it('leaves the address alone when the fragment carries no pass', () => {
    globalThis.history.replaceState(null, '', '/chats#section=2');
    const pass = createAppPass({ storageKey: STORAGE_KEY, header: HEADER, fragmentKey: 'demo' });

    pass.install();

    expect(pass.has()).toBe(false);
    expect(globalThis.location.hash).toBe('#section=2');
  });

  it('ignores the fragment entirely when the app takes no hand-over', () => {
    globalThis.history.replaceState(null, '', `/chats#demo=${makePass()}`);
    const pass = createAppPass({ storageKey: STORAGE_KEY, header: HEADER });

    pass.install();

    expect(pass.has()).toBe(false);
    expect(globalThis.location.hash).not.toBe('');
  });
});
