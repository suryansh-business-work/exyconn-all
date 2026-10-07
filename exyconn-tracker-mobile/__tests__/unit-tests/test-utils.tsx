import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { I18nProvider, type Messages } from '@exyconn/i18n';
import type { Branding, ThemeMode } from '@exyconn/tracker-core';
import { BrandProvider } from '../../src/theme/BrandProvider';

export interface ProviderOptions {
  /** The portal's branding; null paints the fallback brand, as before sign-in. */
  branding?: Branding | null;
  themeMode?: ThemeMode;
  groundOpacity?: number;
  locale?: string;
  /** Translations by English source; empty renders the English the app ships with. */
  messages?: Messages;
  timezone?: string;
  /** Receives every string the screen could not translate. */
  onMissing?: (source: string) => void;
}

/**
 * The providers the root layout puts above every screen — the employee's language and the
 * brand's Tamagui theme — without the tracker behind them: `TrackerI18nProvider` fetches from
 * the portal, so tests give `I18nProvider` its messages directly. Safe-area insets, router and
 * native modules come from the stubs in ./mocks (see vitest.config.mts).
 */
export function createWrapper({
  branding = null,
  themeMode = 'light',
  groundOpacity = 1,
  locale = 'en',
  messages = {},
  timezone = 'UTC',
  onMissing,
}: Readonly<ProviderOptions> = {}) {
  return function Providers({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <I18nProvider
        locale={locale}
        messages={messages}
        onMissing={onMissing}
        settings={{ timezone }}
      >
        <BrandProvider branding={branding} themeMode={themeMode} groundOpacity={groundOpacity}>
          {children}
        </BrandProvider>
      </I18nProvider>
    );
  };
}

/** `render` inside the app's providers. */
export function renderWithProviders(
  ui: ReactElement,
  options: Readonly<ProviderOptions & Omit<RenderOptions, 'wrapper'>> = {},
) {
  const { branding, themeMode, groundOpacity, locale, messages, timezone, onMissing, ...rest } =
    options;
  const wrapper = createWrapper({
    branding,
    themeMode,
    groundOpacity,
    locale,
    messages,
    timezone,
    onMissing,
  });
  return render(ui, { wrapper, ...rest });
}

/** `renderHook` inside the app's providers, for hooks that read the brand or translations. */
export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  options: Readonly<ProviderOptions & { initialProps?: Props }> = {},
) {
  const { initialProps, ...providers } = options;
  return renderHook(hook, { wrapper: createWrapper(providers), initialProps });
}
