import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deviceClass, newId, sessionId } from '../../../src/analytics/session';

const SESSION_KEY = 'exyconn.wa-demo.session';

beforeEach(() => {
  globalThis.sessionStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('newId', () => {
  it('is a fresh random UUID each call', () => {
    const first = newId();
    expect(first).toMatch(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
    expect(newId()).not.toBe(first);
  });
});

describe('sessionId', () => {
  it('creates one id per tab and keeps it in session storage', () => {
    const id = sessionId();
    expect(globalThis.sessionStorage.getItem(SESSION_KEY)).toBe(id);
    expect(sessionId()).toBe(id);
  });

  it('reuses the id a reload left behind', () => {
    globalThis.sessionStorage.setItem(SESSION_KEY, 'existing-session');
    expect(sessionId()).toBe('existing-session');
  });

  it('still answers with a fresh id when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const first = sessionId();
    expect(first).toMatch(/^[\da-f-]{36}$/);
    expect(sessionId()).not.toBe(first);
  });
});

describe('deviceClass', () => {
  it.each([
    [320, 'phone'],
    [599, 'phone'],
    [600, 'tablet'],
    [1023, 'tablet'],
    [1024, 'desktop'],
    [1920, 'desktop'],
  ] as const)('classes a %ipx wide screen as %s', (width, device) => {
    expect(deviceClass(width)).toBe(device);
  });
});
