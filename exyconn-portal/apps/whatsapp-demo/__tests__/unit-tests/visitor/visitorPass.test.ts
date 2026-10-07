import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearVisitorPass,
  hasVisitorPass,
  installVisitorPass,
  storeVisitorPass,
} from '../../../src/visitor/visitorPass';

const apollo = vi.hoisted(() => ({ setAppRequestHeaders: vi.fn() }));
vi.mock('@exyconn/shell/config/apolloClient', () => apollo);

const STORAGE_KEY = 'exyconn.whatsappDemo.visitorPass';
/** Built at runtime: a pass is a credential and never a literal in source. */
const pass = (): string => ['visitor', 'pass', String(Date.now())].join('-');

function sentHeaders(): Record<string, string> {
  const provider = apollo.setAppRequestHeaders.mock.calls.at(-1)?.[0] as () => Record<
    string,
    string
  >;
  return provider();
}

afterEach(() => {
  localStorage.clear();
  apollo.setAppRequestHeaders.mockReset();
  globalThis.history.replaceState(null, '', '/');
});

describe('visitor pass', () => {
  it('is held once stored and gone once cleared', () => {
    expect(hasVisitorPass()).toBe(false);
    const value = pass();
    storeVisitorPass(value);
    expect(hasVisitorPass()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(value);
    clearVisitorPass();
    expect(hasVisitorPass()).toBe(false);
  });

  it('sends the pass as x-demo-visitor on every request, and nothing without one', () => {
    installVisitorPass();
    expect(sentHeaders()).toEqual({});
    const value = pass();
    storeVisitorPass(value);
    expect(sentHeaders()).toEqual({ 'x-demo-visitor': value });
  });

  it('adopts a pass the website hands over in the address fragment and wipes it', () => {
    const value = pass();
    globalThis.history.replaceState(null, '', `/whatsapp-demo/clinic?x=1#visitor=${value}`);
    installVisitorPass();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(value);
    expect(globalThis.location.hash).toBe('');
    expect(globalThis.location.pathname + globalThis.location.search).toBe(
      '/whatsapp-demo/clinic?x=1',
    );
  });
});
