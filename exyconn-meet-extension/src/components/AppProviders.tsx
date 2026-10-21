import { useMemo, type ReactNode } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { I18nProvider, directionOf } from '@exyconn/i18n';
import type { Logger } from '@exyconn/logger';
import { LogErrorBoundary } from '@exyconn/logger/react';
import { ThemeProvider } from '@exyconn/ui';
import { useColorScheme } from '../hooks/useColorScheme';
import { useMessages } from '../hooks/useMessages';
import type { ThemeChoice } from '../storage/prefs';
import { extensionTheme } from '../theme/theme';
import { CrashFallback } from './CrashFallback';

interface Props {
  logger: Logger;
  theme: ThemeChoice;
  /** Inside Meet: the shadow root the app's styles and portals must stay in. */
  shadow?: { root: ShadowRoot; portal: HTMLElement };
  children: ReactNode;
}

const renderFallback = (error: Error, reset: () => void) => (
  <CrashFallback error={error} onRetry={reset} />
);

/**
 * Everything every extension surface needs: the browser's language, the Exyconn theme in the
 * user's scheme, and an error boundary that reports to Tech > Logs and offers Retry.
 */
export function AppProviders({ logger, theme, shadow, children }: Readonly<Props>) {
  const scheme = useColorScheme(theme);
  const messages = useMessages(logger);
  const locale = chrome.i18n.getUILanguage();
  const muiTheme = useMemo(() => extensionTheme(scheme, shadow?.portal), [scheme, shadow]);
  const cache = useMemo(
    () =>
      shadow === undefined
        ? null
        : createCache({ key: 'exy', container: shadow.root, prepend: true }),
    [shadow],
  );

  const tree = (
    <I18nProvider locale={locale} messages={messages}>
      <ThemeProvider theme={muiTheme}>
        <div dir={directionOf(locale)} lang={locale}>
          <LogErrorBoundary logger={logger} fallback={renderFallback}>
            {children}
          </LogErrorBoundary>
        </div>
      </ThemeProvider>
    </I18nProvider>
  );
  return cache === null ? tree : <CacheProvider value={cache}>{tree}</CacheProvider>;
}
