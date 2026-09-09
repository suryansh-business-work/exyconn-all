import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const usePublicBrandingQuery = vi.fn();
vi.mock('@exyconn/shell/graphql/generated', () => ({
  usePublicBrandingQuery: () => usePublicBrandingQuery(),
}));

const { useLoginPage } = await import('../../src/Login/useLoginPage');

/** The registry title for the default bundle ('hub'), used when branding says nothing. */
const REGISTRY_NAME = 'Exyconn Track';
const FALLBACK_ACCENT = '#155dfc';

const brandingWith = (loginPage: Record<string, string>) => ({
  data: {
    publicBranding: {
      businessName: 'Exyconn',
      slogan: 'Build once, run everywhere',
      supportEmail: 'support@exyconn.com',
      logoUrl: '/brand-light.svg',
      logoDarkUrl: '/brand-dark.svg',
      loginPages: [{ app: 'hub', ...loginPage }],
    },
  },
});

describe('useLoginPage', () => {
  beforeEach(() => {
    usePublicBrandingQuery.mockReset();
  });

  it('falls back to the registry name and brand accent before branding resolves', () => {
    usePublicBrandingQuery.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useLoginPage(false));
    expect(result.current.name).toBe(REGISTRY_NAME);
    expect(result.current.accentColor).toBe(FALLBACK_ACCENT);
    expect(result.current.tagline).toBe('');
    expect(result.current.businessName).toBe('');
  });

  it('uses the login page configured for this bundle', () => {
    usePublicBrandingQuery.mockReturnValue(
      brandingWith({
        name: 'Finance',
        tagline: 'Money, minded',
        accentColor: '#ff0000',
        backgroundImageUrl: '/bg.jpg',
      }),
    );
    const { result } = renderHook(() => useLoginPage(false));
    expect(result.current.name).toBe('Finance');
    expect(result.current.tagline).toBe('Money, minded');
    expect(result.current.accentColor).toBe('#ff0000');
    expect(result.current.backgroundImageUrl).toBe('/bg.jpg');
    expect(result.current.slogan).toBe('Build once, run everywhere');
  });

  // Clearing a field in the admin panel should mean "use the default", not "show nothing".
  it('treats a cleared name and accent as unset rather than empty', () => {
    usePublicBrandingQuery.mockReturnValue(
      brandingWith({ name: '', tagline: '', accentColor: '', backgroundImageUrl: '' }),
    );
    const { result } = renderHook(() => useLoginPage(false));
    expect(result.current.name).toBe(REGISTRY_NAME);
    expect(result.current.accentColor).toBe(FALLBACK_ACCENT);
  });

  it('picks the wordmark that suits the colour mode', () => {
    usePublicBrandingQuery.mockReturnValue(brandingWith({ name: 'Finance' }));
    expect(renderHook(() => useLoginPage(false)).result.current.logoUrl).toBe('/brand-light.svg');
    expect(renderHook(() => useLoginPage(true)).result.current.logoUrl).toBe('/brand-dark.svg');
  });

  it('ignores a login page configured for a different bundle', () => {
    usePublicBrandingQuery.mockReturnValue({
      data: {
        publicBranding: {
          businessName: 'Exyconn',
          slogan: '',
          supportEmail: '',
          logoUrl: '',
          logoDarkUrl: '',
          loginPages: [{ app: 'finance', name: 'Finance', tagline: 'Money, minded' }],
        },
      },
    });
    const { result } = renderHook(() => useLoginPage(false));
    expect(result.current.name).toBe(REGISTRY_NAME);
    expect(result.current.tagline).toBe('');
  });
});
