import { afterEach, describe, expect, it } from 'vitest';
import { clientPass } from '../../../src/auth/clientPass';

const KEY = 'exyconn.clientHub.pass';
let counter = 0;
const nextPass = () => {
  counter += 1;
  return `pass-${counter}`;
};

describe('clientPass', () => {
  afterEach(() => clientPass.clear());

  it('has no pass until one is stored', () => {
    expect(clientPass.has()).toBe(false);
  });

  it('keeps the pass under the client hub key', () => {
    const pass = nextPass();
    clientPass.store(pass);
    expect(clientPass.has()).toBe(true);
    expect(globalThis.localStorage.getItem(KEY)).toBe(pass);
  });

  it('forgets the pass on clear', () => {
    clientPass.store(nextPass());
    clientPass.clear();
    expect(clientPass.has()).toBe(false);
    expect(globalThis.localStorage.getItem(KEY)).toBeNull();
  });
});
