import { setAppRequestHeaders } from '@exyconn/shell/config/apolloClient';

/**
 * The demo visitor's pass (email-and-code sign-in), kept per demo origin — never in the portal's
 * shared `.exyconn.com` cookie, so a visitor pass can neither replace nor be mistaken for an
 * employee's portal session. Sent on every request as `x-demo-visitor`.
 *
 * The website hands a fresh pass over in the address fragment (`#visitor=<pass>`), which never
 * reaches a server or a log; it is read once at start-up and wiped from the address bar.
 */
const STORAGE_KEY = 'exyconn.whatsappDemo.visitorPass';
const HEADER = 'x-demo-visitor';
const FRAGMENT_KEY = 'visitor';

function read(): string | null {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeVisitorPass(pass: string): void {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, pass);
  } catch (error) {
    console.error('Could not keep the demo pass', error);
  }
}

export function clearVisitorPass(): void {
  try {
    globalThis.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Could not clear the demo pass', error);
  }
}

export function hasVisitorPass(): boolean {
  return read() !== null;
}

/** Takes over a pass handed over in `#visitor=…`, then removes it from the address. */
function adoptPassFromAddress(): void {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const pass = params.get(FRAGMENT_KEY);
  if (!pass) {
    return;
  }
  storeVisitorPass(pass);
  const { pathname, search } = window.location;
  window.history.replaceState(null, '', `${pathname}${search}`);
}

/** Wires the pass into every API request. Called once, before the app renders. */
export function installVisitorPass(): void {
  adoptPassFromAddress();
  setAppRequestHeaders((): Record<string, string> => {
    const pass = read();
    return pass ? { [HEADER]: pass } : {};
  });
}
