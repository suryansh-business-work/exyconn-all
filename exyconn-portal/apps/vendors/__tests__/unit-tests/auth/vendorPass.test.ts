import { afterEach, describe, expect, it } from 'vitest';
import { vendorPass } from '../../../src/auth/vendorPass';

const KEY = 'exyconn.vendorPortal.pass';
let counter = 0;
const nextPass = () => {
  counter += 1;
  return `pass-${counter}`;
};

describe('vendorPass', () => {
  afterEach(() => vendorPass.clear());

  it('has no pass until one is stored', () => {
    expect(vendorPass.has()).toBe(false);
  });

  it('keeps the pass under the vendor portal key', () => {
    const pass = nextPass();
    vendorPass.store(pass);
    expect(vendorPass.has()).toBe(true);
    expect(globalThis.localStorage.getItem(KEY)).toBe(pass);
  });

  it('forgets the pass on clear', () => {
    vendorPass.store(nextPass());
    vendorPass.clear();
    expect(vendorPass.has()).toBe(false);
    expect(globalThis.localStorage.getItem(KEY)).toBeNull();
  });
});
