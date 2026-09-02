import { describe, it, expect } from 'vitest';
import { DEFAULT_REDIRECT, safeNext } from '../../src/utils/redirect';

describe('safeNext', () => {
  it('accepts a same-origin absolute path, with search and hash preserved', () => {
    expect(safeNext('/portal/tracker/access')).toBe('/portal/tracker/access');
    expect(safeNext('/portal/tracker?employee=u1&month=2026-07')).toBe(
      '/portal/tracker?employee=u1&month=2026-07',
    );
  });

  it('falls back to the portal when there is no attempted URL', () => {
    expect(safeNext(null)).toBe(DEFAULT_REDIRECT);
    expect(safeNext('')).toBe(DEFAULT_REDIRECT);
  });

  it('rejects protocol-relative and off-site URLs (open-redirect guard)', () => {
    expect(safeNext('//evil.com')).toBe(DEFAULT_REDIRECT);
    expect(safeNext('//evil.com/portal')).toBe(DEFAULT_REDIRECT);
    expect(safeNext(String.raw`/\evil.com`)).toBe(DEFAULT_REDIRECT);
    expect(safeNext('https://evil.com')).toBe(DEFAULT_REDIRECT);
    expect(safeNext('javascript:alert(1)')).toBe(DEFAULT_REDIRECT);
    expect(safeNext('portal/tracker')).toBe(DEFAULT_REDIRECT);
  });
});
