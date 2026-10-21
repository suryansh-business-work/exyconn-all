import { vi } from 'vitest';
import type { KeyValueArea } from '../../src/storage/area';

type Listener = (...args: never[]) => unknown;

/** A `chrome.events.Event`: listeners can be added, removed and fired by the test. */
export class FakeEvent<T extends Listener> {
  readonly listeners = new Set<T>();

  addListener(listener: T): void {
    this.listeners.add(listener);
  }

  removeListener(listener: T): void {
    this.listeners.delete(listener);
  }

  hasListener(listener: T): boolean {
    return this.listeners.has(listener);
  }

  /** Calls every listener; returns what each returned. */
  emit(...args: Parameters<T>): unknown[] {
    return [...this.listeners].map((listener) => listener(...args));
  }
}

type ChangeListener = (
  changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
  area: string,
) => void;

/** An in-memory `chrome.storage` area with the same promise API and JSON copy semantics. */
export class MemoryArea implements KeyValueArea {
  readonly data = new Map<string, unknown>();
  readonly writes: Array<Record<string, unknown>> = [];
  readonly setAccessLevel = vi.fn(() => Promise.resolve());

  constructor(
    private readonly name = 'local',
    private readonly onChanged?: FakeEvent<ChangeListener>,
  ) {}

  get(keys: string | string[]): Promise<Record<string, unknown>> {
    const wanted = Array.isArray(keys) ? keys : [keys];
    return Promise.resolve(
      Object.fromEntries(
        wanted
          .filter((key) => this.data.has(key))
          .map((key) => [key, structuredClone(this.data.get(key))]),
      ),
    );
  }

  set(items: Record<string, unknown>): Promise<void> {
    this.writes.push(structuredClone(items));
    const changes: Record<string, { newValue?: unknown; oldValue?: unknown }> = {};
    for (const [key, value] of Object.entries(items)) {
      changes[key] = { oldValue: this.data.get(key), newValue: structuredClone(value) };
      this.data.set(key, structuredClone(value));
    }
    this.onChanged?.emit(changes, this.name);
    return Promise.resolve();
  }

  remove(keys: string | string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      this.data.delete(key);
    }
    return Promise.resolve();
  }
}

type MessageListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (reply: unknown) => void,
) => boolean | undefined;

/** Everything of `chrome.*` the extension touches, faked in memory. */
export function createChrome() {
  const onChanged = new FakeEvent<ChangeListener>();
  const alarms = new Map<string, chrome.alarms.Alarm>();
  return {
    storage: {
      session: new MemoryArea('session', onChanged),
      local: new MemoryArea('local', onChanged),
      sync: new MemoryArea('sync', onChanged),
      onChanged,
    },
    runtime: {
      id: 'test-extension-id' as string | undefined,
      sendMessage: vi.fn<(message: unknown) => Promise<unknown>>(() => Promise.resolve(undefined)),
      onMessage: new FakeEvent<MessageListener>(),
      getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
      getPlatformInfo: vi.fn(() => Promise.resolve({ os: 'mac' })),
      getContexts: vi.fn(() => Promise.resolve([] as unknown[])),
      openOptionsPage: vi.fn(() => Promise.resolve()),
      ContextType: { OFFSCREEN_DOCUMENT: 'OFFSCREEN_DOCUMENT' },
    },
    alarms: {
      store: alarms,
      create: vi.fn((name: string, info: chrome.alarms.AlarmCreateInfo) => {
        alarms.set(name, {
          name,
          scheduledTime: info.when ?? 0,
          periodInMinutes: info.periodInMinutes,
          persistAcrossSessions: false,
        });
        return Promise.resolve();
      }),
      clear: vi.fn((name: string) => Promise.resolve(alarms.delete(name))),
      get: vi.fn((name: string) => Promise.resolve(alarms.get(name))),
      onAlarm: new FakeEvent<(alarm: chrome.alarms.Alarm) => void>(),
    },
    notifications: {
      create: vi.fn(() => Promise.resolve('id')),
      clear: vi.fn(() => Promise.resolve(true)),
      onButtonClicked: new FakeEvent<(id: string, index: number) => void>(),
      onClicked: new FakeEvent<(id: string) => void>(),
    },
    tabs: {
      sendMessage: vi.fn(() => Promise.resolve(undefined)),
      update: vi.fn((tabId: number) =>
        Promise.resolve({ id: tabId, windowId: 3 } as chrome.tabs.Tab | undefined),
      ),
      query: vi.fn(() => Promise.resolve([{ id: 7 }] as chrome.tabs.Tab[])),
      onRemoved: new FakeEvent<(tabId: number) => void>(),
    },
    windows: { update: vi.fn(() => Promise.resolve({})) },
    action: {
      setBadgeText: vi.fn(() => Promise.resolve()),
      setBadgeBackgroundColor: vi.fn(() => Promise.resolve()),
      setBadgeTextColor: vi.fn(() => Promise.resolve()),
      setTitle: vi.fn(() => Promise.resolve()),
    },
    offscreen: {
      createDocument: vi.fn(() => Promise.resolve()),
      closeDocument: vi.fn(() => Promise.resolve()),
      Reason: { USER_MEDIA: 'USER_MEDIA' },
    },
    tabCapture: { getMediaStreamId: vi.fn(() => Promise.resolve('stream-1')) },
    identity: {
      getRedirectURL: (path: string) => `https://test-extension-id.chromiumapp.org/${path}`,
      launchWebAuthFlow: vi.fn<(details: { url: string }) => Promise<string | undefined>>(),
    },
    i18n: { getUILanguage: () => 'en-US' },
  };
}

export type ChromeMock = ReturnType<typeof createChrome>;

/** Installs a fresh fake `chrome` global. */
export function installChrome(): ChromeMock {
  const mock = createChrome();
  vi.stubGlobal('chrome', mock);
  return mock;
}

/**
 * Delivers a message to the registered `runtime.onMessage` listeners the way Chrome does and
 * resolves with the reply (or undefined when no listener answers).
 */
export function dispatchMessage(
  mock: ChromeMock,
  message: unknown,
  sender: chrome.runtime.MessageSender = { id: 'test-extension-id' },
): Promise<unknown> {
  return new Promise((resolve) => {
    const kept = mock.runtime.onMessage.emit(message, sender, resolve);
    if (!kept.includes(true)) {
      resolve(undefined);
    }
  });
}

/** A `Response` with a JSON body (or raw text) and a status. */
export function jsonResponse(status: number, body: unknown): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Response(status === 204 ? null : text, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
