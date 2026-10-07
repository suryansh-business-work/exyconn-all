import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBrandingQuery } from '@/graphql/generated';
import { useBrandLogo, useBrandMark } from '@/hooks/useBrandMark';

const { colorMode } = vi.hoisted(() => ({ colorMode: { mode: 'light' } }));

vi.mock('@/theme/ColorModeContext', () => ({ useColorMode: () => colorMode }));
vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useBrandingQuery: vi.fn(),
}));

type QueryResult = ReturnType<typeof useBrandingQuery>;

const FULL = {
  faviconUrl: '/acme-icon.png',
  faviconDarkUrl: '/acme-icon-dark.png',
  logoUrl: '/acme-logo.png',
  logoDarkUrl: '/acme-logo-dark.png',
};

function brand(branding: Partial<typeof FULL> | undefined, mode: 'light' | 'dark') {
  colorMode.mode = mode;
  const data = branding ? { branding } : undefined;
  vi.mocked(useBrandingQuery).mockReturnValue({ data } as QueryResult);
}

beforeEach(() => {
  vi.mocked(useBrandingQuery).mockReset();
});

describe('useBrandMark', () => {
  it("uses the organisation's icon for the colour mode", () => {
    brand(FULL, 'light');
    expect(renderHook(() => useBrandMark()).result.current).toBe('/acme-icon.png');
    brand(FULL, 'dark');
    expect(renderHook(() => useBrandMark()).result.current).toBe('/acme-icon-dark.png');
  });

  it('falls back to the built-in icon before branding loads', () => {
    brand(undefined, 'dark');
    expect(renderHook(() => useBrandMark()).result.current).toBe('/exyconn-icon.svg');
  });
});

describe('useBrandLogo', () => {
  it("uses the organisation's logo for the colour mode", () => {
    brand(FULL, 'light');
    expect(renderHook(() => useBrandLogo()).result.current).toBe('/acme-logo.png');
    brand(FULL, 'dark');
    expect(renderHook(() => useBrandLogo()).result.current).toBe('/acme-logo-dark.png');
  });

  it('never shows the light logo on the dark sidebar', () => {
    brand({ logoUrl: '/acme-logo.png', logoDarkUrl: '' }, 'dark');
    expect(renderHook(() => useBrandLogo()).result.current).toBe('/exyconn-logo-dark.svg');
  });

  it('falls back to the built-in wordmarks before branding loads', () => {
    brand(undefined, 'light');
    expect(renderHook(() => useBrandLogo()).result.current).toBe('/exyconn-logo.svg');
    brand(undefined, 'dark');
    expect(renderHook(() => useBrandLogo()).result.current).toBe('/exyconn-logo-dark.svg');
  });
});
