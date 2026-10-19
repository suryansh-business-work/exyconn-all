import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookingAddress } from '../../../../src/pages/book/useBookingAddress';
import { renderHookWithProviders } from '../../test-utils';

const organization = vi.hoisted(() => ({ slug: 'acme' as string | null }));

vi.mock('@exyconn/shell/config/organizationPath', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/config/organizationPath')>()),
  get CURRENT_ORGANIZATION_SLUG() {
    return organization.slug;
  },
}));

describe('useBookingAddress', () => {
  beforeEach(() => {
    organization.slug = 'acme';
  });

  it('reads the company from the address prefix and the page and meeting from the route', () => {
    const { result } = renderHookWithProviders(() => useBookingAddress(), {
      path: '/book/:page/:slug',
      route: '/book/team/intro-call',
    });

    expect(result.current).toEqual({ at: { org: 'acme', page: 'team' }, slug: 'intro-call' });
  });

  it('has no meeting on the company’s own booking page', () => {
    const { result } = renderHookWithProviders(() => useBookingAddress(), {
      path: '/book/:page',
      route: '/book/team',
    });

    expect(result.current).toEqual({ at: { org: 'acme', page: 'team' }, slug: '' });
  });

  it('leaves the company and page blank when the address names neither', () => {
    organization.slug = null;

    const { result } = renderHookWithProviders(() => useBookingAddress());

    expect(result.current).toEqual({ at: { org: '', page: '' }, slug: '' });
  });
});
