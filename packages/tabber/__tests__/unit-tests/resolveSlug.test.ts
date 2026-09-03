import { describe, it, expect } from 'vitest';
import { resolveSlug } from '../../src/resolveSlug';

const SLUGS = ['slack', 'imagekit', 'smtp'];
const BASE = '/environment-variables';

describe('resolveSlug', () => {
  it('reads the tab named in the URL', () => {
    expect(resolveSlug(`${BASE}/imagekit`, BASE, SLUGS)).toEqual({
      slug: 'imagekit',
      needsRedirect: false,
    });
  });

  it('falls back to the first tab on the bare base path', () => {
    expect(resolveSlug(BASE, BASE, SLUGS)).toEqual({ slug: 'slack', needsRedirect: true });
  });

  it('falls back to the first tab when the slug is unknown', () => {
    expect(resolveSlug(`${BASE}/removed-tab`, BASE, SLUGS)).toEqual({
      slug: 'slack',
      needsRedirect: true,
    });
  });

  it('keeps the parent tab for a deeper route beneath it', () => {
    expect(resolveSlug(`${BASE}/smtp/config-1`, BASE, SLUGS)).toEqual({
      slug: 'smtp',
      needsRedirect: false,
    });
  });

  it('does not treat a sibling path that merely shares a prefix as a tab', () => {
    expect(resolveSlug('/environment-variables-archive/smtp', BASE, SLUGS)).toEqual({
      slug: 'slack',
      needsRedirect: true,
    });
  });

  it('asks for no redirect when there are no tabs to show', () => {
    expect(resolveSlug(BASE, BASE, [])).toEqual({ slug: '', needsRedirect: false });
  });
});
