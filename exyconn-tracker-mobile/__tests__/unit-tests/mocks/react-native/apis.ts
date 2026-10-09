import { vi } from 'vitest';

/**
 * React Native's imperative APIs as spies. Event sources (AppState, Keyboard, Dimensions,
 * AccessibilityInfo) keep their listeners so a test can fire them through `rnTest`.
 */

type Listener = (...args: unknown[]) => void;

/** A named-event registry whose `subscribe` returns RN's `{ remove }` subscription. */
function createEmitter() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    subscribe(event: string, listener: Listener) {
      const set = listeners.get(event) ?? new Set<Listener>();
      set.add(listener);
      listeners.set(event, set);
      return { remove: vi.fn(() => set.delete(listener)) };
    },
    emit(event: string, ...args: unknown[]) {
      for (const listener of listeners.get(event) ?? []) {
        listener(...args);
      }
    },
    count: (event: string) => listeners.get(event)?.size ?? 0,
    clear: () => listeners.clear(),
  };
}

type PlatformOS = 'ios' | 'android' | 'web';

export const Platform = {
  OS: 'ios' as PlatformOS,
  Version: 17,
  isTV: false,
  select<T>(options: Partial<Record<PlatformOS | 'native' | 'default', T>>): T | undefined {
    return options[Platform.OS] ?? options.native ?? options.default;
  },
};

const appStateEvents = createEmitter();
export const AppState = {
  currentState: 'active' as string,
  addEventListener: vi.fn((event: string, listener: Listener) =>
    appStateEvents.subscribe(event, listener),
  ),
};

const keyboardEvents = createEmitter();
export const Keyboard = {
  addListener: vi.fn((event: string, listener: Listener) =>
    keyboardEvents.subscribe(event, listener),
  ),
  dismiss: vi.fn(),
  removeAllListeners: vi.fn((_event?: string) => keyboardEvents.clear()),
  isVisible: vi.fn(() => false),
};

const WINDOW = { width: 390, height: 844, scale: 3, fontScale: 1 };
const dimensionEvents = createEmitter();
export const Dimensions = {
  get: vi.fn((_dimension: 'window' | 'screen') => ({ ...WINDOW })),
  addEventListener: vi.fn((event: string, listener: Listener) =>
    dimensionEvents.subscribe(event, listener),
  ),
};

export const PixelRatio = {
  get: vi.fn(() => WINDOW.scale),
  getFontScale: vi.fn(() => WINDOW.fontScale),
  getPixelSizeForLayoutSize: (size: number) => Math.round(size * WINDOW.scale),
  roundToNearestPixel: (size: number) => Math.round(size * WINDOW.scale) / WINDOW.scale,
};

const a11yEvents = createEmitter();
export const AccessibilityInfo = {
  isReduceMotionEnabled: vi.fn(() => Promise.resolve(false)),
  isScreenReaderEnabled: vi.fn(() => Promise.resolve(false)),
  addEventListener: vi.fn((event: string, listener: Listener) =>
    a11yEvents.subscribe(event, listener),
  ),
  announceForAccessibility: vi.fn(),
  sendAccessibilityEvent: vi.fn(),
  setAccessibilityFocus: vi.fn(),
};

export const Linking = {
  openURL: vi.fn((_url: string) => Promise.resolve(true)),
  openSettings: vi.fn(() => Promise.resolve()),
  canOpenURL: vi.fn((_url: string) => Promise.resolve(true)),
  getInitialURL: vi.fn(() => Promise.resolve(null)),
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
};

export const PermissionsAndroid = {
  PERMISSIONS: {
    CAMERA: 'android.permission.CAMERA',
    POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
  },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied', NEVER_ASK_AGAIN: 'never_ask_again' },
  check: vi.fn((_permission: string) => Promise.resolve(false)),
  request: vi.fn((_permission: string) => Promise.resolve('granted')),
};

export const AppRegistry = {
  registerHeadlessTask: vi.fn(),
  registerComponent: vi.fn(),
};

export const PanResponder = {
  create: vi.fn(() => ({ panHandlers: {} })),
};

export const I18nManager = { isRTL: false, allowRTL: vi.fn(), forceRTL: vi.fn() };

export const InteractionManager = {
  runAfterInteractions: vi.fn((task?: () => void) => {
    task?.();
    return Object.assign(Promise.resolve(), { cancel: vi.fn() });
  }),
};

export const NativeModules: Record<string, unknown> = {};

export const StyleSheet = {
  create: <T extends object>(styles: T): T => styles,
  flatten: (style: unknown): Record<string, unknown> => {
    if (Array.isArray(style)) {
      return Object.assign({}, ...style.map((part) => StyleSheet.flatten(part)));
    }
    return typeof style === 'object' && style !== null ? { ...style } : {};
  },
  compose: (a: unknown, b: unknown) => [a, b],
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const,
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const,
};

/** Fires the native events this shim records. Import from this file, not 'react-native'. */
export const rnTest = {
  appState(next: string) {
    AppState.currentState = next;
    appStateEvents.emit('change', next);
  },
  keyboard(event: string, payload: unknown = {}) {
    keyboardEvents.emit(event, payload);
  },
  dimensions(window: Partial<typeof WINDOW>) {
    const next = { ...WINDOW, ...window };
    Dimensions.get.mockReturnValue(next);
    dimensionEvents.emit('change', { window: next, screen: next });
  },
  accessibility(event: string, value: unknown) {
    a11yEvents.emit(event, value);
  },
  /** Fires a host element's `onLayout` with this frame. */
  layout(element: Element, layout: { x?: number; y?: number; width: number; height: number }) {
    element.dispatchEvent(new CustomEvent('rnlayout', { detail: { x: 0, y: 0, ...layout } }));
  },
  listenerCount: (source: 'appState' | 'keyboard' | 'accessibility', event: string) =>
    ({ appState: appStateEvents, keyboard: keyboardEvents, accessibility: a11yEvents })[
      source
    ].count(event),
  /** Puts every shared value back; the setup file calls it after each test. */
  reset() {
    Platform.OS = 'ios';
    AppState.currentState = 'active';
    Dimensions.get.mockReset();
    for (const emitter of [appStateEvents, keyboardEvents, dimensionEvents, a11yEvents]) {
      emitter.clear();
    }
  },
};
