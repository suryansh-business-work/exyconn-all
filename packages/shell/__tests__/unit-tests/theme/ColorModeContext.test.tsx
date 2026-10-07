import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { I18nProvider } from '@exyconn/i18n';
import { useTheme } from '@exyconn/ui/styles';
import { ColorModeProvider, useColorMode } from '@/theme/ColorModeContext';

const STORAGE_KEY = 'exyconn-track.color-mode';

function renderMode(locale = 'en') {
  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <I18nProvider locale={locale} messages={{}}>
        <ColorModeProvider>{children}</ColorModeProvider>
      </I18nProvider>
    );
  }
  return renderHook(() => ({ colorMode: useColorMode(), theme: useTheme() }), {
    wrapper: Wrapper,
  });
}

/** A system colour-scheme preference, as matchMedia reports it. */
function prefersDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: dark && query === '(prefers-color-scheme: dark)' })),
  );
}

describe('ColorModeProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens in the person's saved choice over their system's", () => {
    prefersDark(true);
    localStorage.setItem(STORAGE_KEY, 'light');

    const { result } = renderMode();

    expect(result.current.colorMode.mode).toBe('light');
    expect(result.current.theme.palette.mode).toBe('light');
  });

  it('opens in a saved dark choice', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');

    expect(renderMode().result.current.theme.palette.mode).toBe('dark');
  });

  it('follows the system when nothing valid is saved', () => {
    localStorage.setItem(STORAGE_KEY, 'sepia');
    prefersDark(true);
    expect(renderMode().result.current.colorMode.mode).toBe('dark');
  });

  it('falls back to light when the system prefers it, or cannot say', () => {
    prefersDark(false);
    expect(renderMode().result.current.colorMode.mode).toBe('light');

    vi.stubGlobal('matchMedia', undefined);
    expect(renderMode().result.current.colorMode.mode).toBe('light');
  });

  it('toggles between the modes and remembers the choice', () => {
    const { result } = renderMode();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');

    act(() => result.current.colorMode.toggle());
    expect(result.current.colorMode.mode).toBe('dark');
    expect(result.current.theme.palette.mode).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');

    act(() => result.current.colorMode.toggle());
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('builds the theme in the direction of the language', () => {
    expect(renderMode('en').result.current.theme.direction).toBe('ltr');
    expect(renderMode('ar').result.current.theme.direction).toBe('rtl');
  });
});

describe('useColorMode', () => {
  it('refuses to work outside the provider', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useColorMode())).toThrow(
      'useColorMode must be used within a ColorModeProvider',
    );
    quiet.mockRestore();
  });
});
