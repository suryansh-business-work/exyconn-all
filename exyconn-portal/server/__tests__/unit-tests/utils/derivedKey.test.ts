import { hkdfSync } from 'node:crypto';
import { env } from '../../../src/config/env';
import { derivedKey } from '../../../src/utils/derivedKey';

describe('derivedKey', () => {
  it('derives a 256-bit key from the JWT secret with HKDF-SHA256', () => {
    const key = derivedKey('purpose-a');
    expect(key).toHaveLength(32);
    const expected = Buffer.from(hkdfSync('sha256', env.jwtSecret, 'exyconn', 'purpose-a', 32));
    expect(key.equals(expected)).toBe(true);
  });

  it('is stable for one purpose and different for another', () => {
    expect(derivedKey('purpose-a').equals(derivedKey('purpose-a'))).toBe(true);
    expect(derivedKey('purpose-a').equals(derivedKey('purpose-b'))).toBe(false);
  });
});
