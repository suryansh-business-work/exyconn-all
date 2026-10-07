import { renderHook } from '@testing-library/react';
import { env } from '@exyconn/shell/config/env';
import { BUNDLE, brandingResult } from '../branding';

const usePublicBrandingQuery = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', () => ({
  usePublicBrandingQuery: () => usePublicBrandingQuery(),
}));

const { useLoginPage } = await import('../../../src/Login/useLoginPage');

describe('useLoginPage images', () => {
  beforeEach(() => {
    usePublicBrandingQuery.mockReset();
  });

  it('falls back to the bundled wordmark for each colour mode when branding has none', () => {
    usePublicBrandingQuery.mockReturnValue(brandingResult());
    expect(renderHook(() => useLoginPage(false)).result.current.logoUrl).toBe(env.logoUrl);
    expect(renderHook(() => useLoginPage(true)).result.current.logoUrl).toBe(env.logoDarkUrl);
  });

  it('treats a cleared wordmark as unset and uses the bundled one', () => {
    usePublicBrandingQuery.mockReturnValue(
      brandingResult({ logoUrl: '', logoDarkUrl: '', loginPages: [] }),
    );
    expect(renderHook(() => useLoginPage(true)).result.current.logoUrl).toBe(env.logoDarkUrl);
    expect(renderHook(() => useLoginPage(false)).result.current.logoUrl).toBe(env.logoUrl);
  });

  it('picks the favicon for the colour mode, falling back to the bundled icon', () => {
    usePublicBrandingQuery.mockReturnValue(
      brandingResult({
        faviconUrl: '/fav-light.png',
        faviconDarkUrl: '/fav-dark.png',
        loginPages: [{ app: BUNDLE }],
      }),
    );
    expect(renderHook(() => useLoginPage(false)).result.current.faviconUrl).toBe('/fav-light.png');
    expect(renderHook(() => useLoginPage(true)).result.current.faviconUrl).toBe('/fav-dark.png');

    usePublicBrandingQuery.mockReturnValue(brandingResult());
    expect(renderHook(() => useLoginPage(true)).result.current.faviconUrl).toBe(env.iconUrl);
  });

  it('passes through the support email and the slogan, empty when branding has none', () => {
    usePublicBrandingQuery.mockReturnValue(
      brandingResult({ supportEmail: 'help@example.com', slogan: 'Hello', loginPages: [] }),
    );
    const { result } = renderHook(() => useLoginPage(false));
    expect(result.current.supportEmail).toBe('help@example.com');
    expect(result.current.slogan).toBe('Hello');

    usePublicBrandingQuery.mockReturnValue(brandingResult());
    const empty = renderHook(() => useLoginPage(false)).result.current;
    expect(empty.supportEmail).toBe('');
    expect(empty.backgroundImageUrl).toBe('');
  });
});
