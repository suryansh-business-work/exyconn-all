/** One demo session per browser tab: survives a reload, ends with the tab. */
const SESSION_KEY = 'exyconn.wa-demo.session';

export function newId(): string {
  return globalThis.crypto.randomUUID();
}

export function sessionId(): string {
  try {
    const existing = globalThis.sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      return existing;
    }
    const id = newId();
    globalThis.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return newId();
  }
}

/** Width breakpoints of the device classes the dashboard splits by. */
const PHONE_MAX = 600;
const TABLET_MAX = 1024;

export function deviceClass(width: number): 'phone' | 'tablet' | 'desktop' {
  if (width < PHONE_MAX) {
    return 'phone';
  }
  return width < TABLET_MAX ? 'tablet' : 'desktop';
}
