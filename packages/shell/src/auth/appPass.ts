import { setAppRequestHeaders } from '@/config/apolloClient';

/**
 * A pass held by somebody who is not a portal user — a WhatsApp demo visitor, a client hub
 * contact — kept per app origin, never in the portal's shared `.exyconn.com` cookie, so a pass
 * can neither replace nor be mistaken for an employee's portal session. Sent on every API
 * request in its own header.
 *
 * A site that signs somebody in elsewhere can hand the pass over in the address fragment
 * (`#<fragmentKey>=<pass>`), which never reaches a server or a log; it is read once at start-up
 * and wiped from the address bar.
 */
export interface AppPassOptions {
  storageKey: string;
  header: string;
  fragmentKey?: string;
}

export interface AppPass {
  has: () => boolean;
  store: (pass: string) => void;
  clear: () => void;
  /** Wires the pass into every API request. Call once, before the app renders. */
  install: () => void;
}

export function createAppPass({ storageKey, header, fragmentKey }: AppPassOptions): AppPass {
  const read = (): string | null => {
    try {
      return globalThis.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };
  const store = (pass: string) => {
    try {
      globalThis.localStorage.setItem(storageKey, pass);
    } catch (error) {
      console.error('Could not keep the pass', error);
    }
  };
  const clear = () => {
    try {
      globalThis.localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Could not clear the pass', error);
    }
  };
  const adoptFromAddress = () => {
    if (!fragmentKey) return;
    const pass = new URLSearchParams(globalThis.location.hash.slice(1)).get(fragmentKey);
    if (!pass) return;
    store(pass);
    const { pathname, search } = globalThis.location;
    globalThis.history.replaceState(null, '', `${pathname}${search}`);
  };
  return {
    has: () => read() !== null,
    store,
    clear,
    install: () => {
      adoptFromAddress();
      setAppRequestHeaders((): Record<string, string> => {
        const pass = read();
        return pass ? { [header]: pass } : {};
      });
    },
  };
}
