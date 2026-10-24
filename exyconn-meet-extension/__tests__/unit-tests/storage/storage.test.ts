import { describe, expect, it } from 'vitest';
import { createSlot, isRecord } from '../../../src/storage/area';
import {
  DEFAULT_LAYOUT,
  clampPanelWidth,
  createLayoutStore,
  parseLayout,
} from '../../../src/storage/layout';
import {
  DEFAULT_PREFS,
  createPrefsStore,
  parsePrefs,
  prefsSchema,
} from '../../../src/storage/prefs';
import { createTokenStore } from '../../../src/storage/tokens';
import { MemoryArea } from '../chrome-mock';

describe('createSlot', () => {
  it('reads nothing until written, then the parsed value, then nothing after clear', async () => {
    const area = new MemoryArea();
    const slot = createSlot(area, 'k', (raw) => (typeof raw === 'number' ? raw : null));
    await expect(slot.read()).resolves.toBeNull();
    await slot.write(4);
    await expect(slot.read()).resolves.toBe(4);
    await area.set({ k: 'corrupt' });
    await expect(slot.read()).resolves.toBeNull();
    await slot.clear();
    expect(area.data.has('k')).toBe(false);
  });

  it('recognises plain objects only', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
  });
});

describe('token store', () => {
  it('keeps the access token in session and the refresh token in local storage', async () => {
    const session = new MemoryArea();
    const local = new MemoryArea();
    const store = createTokenStore(session, local);
    await store.save({ token: 'a', expiresAt: 1 }, { token: 'r', expiresAt: 2 }, true);
    expect(session.data.get('auth.access')).toEqual({ token: 'a', expiresAt: 1 });
    expect(local.data.get('auth.refresh')).toEqual({ token: 'r', expiresAt: 2 });
    expect(local.writes[0]).toHaveProperty('auth.refresh');
    await expect(store.readAccess()).resolves.toEqual({ token: 'a', expiresAt: 1 });
    await expect(store.readRefresh()).resolves.toEqual({
      token: 'r',
      expiresAt: 2,
      remembered: true,
    });
    await store.clear();
    await expect(store.readAccess()).resolves.toBeNull();
    await expect(store.readRefresh()).resolves.toBeNull();
  });

  it('keeps a sign-in without "Remember me" in session storage only', async () => {
    const session = new MemoryArea();
    const local = new MemoryArea();
    const store = createTokenStore(session, local);
    await store.save({ token: 'a', expiresAt: 1 }, { token: 'r1', expiresAt: 2 }, true);
    await store.save({ token: 'a', expiresAt: 1 }, { token: 'r2', expiresAt: 2 }, false);
    expect(local.data.has('auth.refresh')).toBe(false);
    expect(session.data.get('auth.refresh')).toEqual({ token: 'r2', expiresAt: 2 });
    await expect(store.readRefresh()).resolves.toEqual({
      token: 'r2',
      expiresAt: 2,
      remembered: false,
    });
    await store.clear();
    expect(session.data.has('auth.refresh')).toBe(false);
  });

  it('treats a malformed stored token as signed out', async () => {
    const session = new MemoryArea();
    await session.set({ 'auth.access': { token: 5 } });
    await expect(createTokenStore(session, new MemoryArea()).readAccess()).resolves.toBeNull();
  });
});

describe('prefs', () => {
  it('reads defaults when nothing is stored', async () => {
    await expect(createPrefsStore(new MemoryArea()).read()).resolves.toEqual(DEFAULT_PREFS);
  });

  it('keeps valid fields and replaces only the invalid ones', () => {
    const parsed = parsePrefs({
      theme: 'dark',
      snoozeMinutes: 1,
      reminderInterval: '7',
      liveTranscript: false,
    });
    expect(parsed).toEqual({ ...DEFAULT_PREFS, theme: 'dark', liveTranscript: false });
    expect(parsePrefs('garbage')).toEqual(DEFAULT_PREFS);
  });

  it('round-trips through storage and refuses invalid values on write', async () => {
    const store = createPrefsStore(new MemoryArea());
    await store.write({ ...DEFAULT_PREFS, snoozeMinutes: 30, iconCorner: 'top-right' });
    await expect(store.read()).resolves.toMatchObject({
      snoozeMinutes: 30,
      iconCorner: 'top-right',
    });
    await expect(store.write({ ...DEFAULT_PREFS, snoozeMinutes: 500 })).rejects.toThrow();
  });

  it('validates the snooze length with readable messages', () => {
    const result = prefsSchema.safeParse({ ...DEFAULT_PREFS, snoozeMinutes: 2.5 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain('Use whole minutes');
  });
});

describe('layout', () => {
  it('clamps the panel width', () => {
    expect(clampPanelWidth(100)).toBe(300);
    expect(clampPanelWidth(1000)).toBe(560);
    expect(clampPanelWidth(400.4)).toBe(400);
  });

  it('parses stored layout defensively', () => {
    expect(parseLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout({ iconOffset: { x: 1, y: 2 }, panelWidth: 999 })).toEqual({
      iconOffset: { x: 1, y: 2 },
      panelWidth: 560,
    });
    expect(parseLayout({ iconOffset: 'x' })).toEqual(DEFAULT_LAYOUT);
  });

  it('persists the layout', async () => {
    const store = createLayoutStore(new MemoryArea());
    await expect(store.read()).resolves.toEqual(DEFAULT_LAYOUT);
    await store.write({ iconOffset: { x: 5, y: 6 }, panelWidth: 400 });
    await expect(store.read()).resolves.toEqual({ iconOffset: { x: 5, y: 6 }, panelWidth: 400 });
  });
});
