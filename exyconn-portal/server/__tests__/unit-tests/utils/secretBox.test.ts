import { open, seal } from '../../../src/utils/secretBox';

const PLAIN = `token-${Date.now()}-ünïcode`;

describe('secretBox', () => {
  it('round-trips a value through seal and open', () => {
    expect(open(seal(PLAIN))).toBe(PLAIN);
  });

  it('writes v1.<iv>.<tag>.<ciphertext> and never the plain text', () => {
    const sealed = seal(PLAIN);
    const parts = sealed.split('.');
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe('v1');
    expect(Buffer.from(parts[1], 'base64url')).toHaveLength(12);
    expect(Buffer.from(parts[2], 'base64url')).toHaveLength(16);
    expect(sealed).not.toContain(PLAIN);
  });

  it('uses a fresh IV every time, so the same value seals differently', () => {
    expect(seal(PLAIN)).not.toBe(seal(PLAIN));
  });

  it.each([
    ['another version', (parts: string[]) => ['v2', ...parts.slice(1)].join('.')],
    ['a missing body', (parts: string[]) => parts.slice(0, 3).join('.')],
    ['an empty IV', (parts: string[]) => [parts[0], '', parts[2], parts[3]].join('.')],
    ['an empty tag', (parts: string[]) => [parts[0], parts[1], '', parts[3]].join('.')],
  ])('refuses a value with %s', (_label, mangle) => {
    const mangled = mangle(seal(PLAIN).split('.'));
    expect(() => open(mangled)).toThrow('Not a sealed value');
  });

  it('refuses a value that is not sealed at all', () => {
    expect(() => open('plain-text')).toThrow('Not a sealed value');
  });

  it('fails authentication when the ciphertext was tampered with', () => {
    const [version, iv, tag, body] = seal(PLAIN).split('.');
    const bytes = Buffer.from(body, 'base64url');
    bytes[0] ^= 0xff;
    expect(() => open([version, iv, tag, bytes.toString('base64url')].join('.'))).toThrow();
  });
});
