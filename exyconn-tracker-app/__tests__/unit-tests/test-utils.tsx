/**
 * Shared helpers for the tracker's unit tests under __tests__/unit-tests.
 *
 * The renderer talks to the main process only through `window.tracker`, so a component test
 * needs no network mocks: install the fake bridge (`mount` does it from a `TrackerState`,
 * `stubTracker` takes a hand-made one, `overrideTracker` swaps chosen commands) and render.
 * The harnesses live next to the existing colocated tests in src/renderer/a11y and are
 * re-exported here so both test locations use the same helpers.
 */
import type { ReactElement, ReactNode } from 'react';
import { I18nProvider, type Messages } from '@exyconn/i18n';
import { ThemeProvider } from '@exyconn/ui';
import type { Branding, ThemeMode } from '@shared/types';
import { buildTheme } from '../../src/renderer/theme';

export {
  cleanup,
  click,
  installDomShims,
  mount,
  press,
  settle,
  unmount,
} from '../../src/renderer/a11y/render-harness';
export {
  button,
  buttonNamed,
  choose,
  click as clickElement,
  deferred,
  errorText,
  finish,
  flush,
  isLoading,
  overrideTracker,
  press as pressButton,
  render,
  rerender,
  stubTracker,
  typeInto,
  unmountAll,
  type Deferred,
} from '../../src/renderer/a11y/component-harness';
export { installTracker, trackerState } from '../../src/renderer/a11y/tracker-fixture';

export interface ProviderOptions {
  branding?: Branding | null;
  themeMode?: ThemeMode;
  locale?: string;
  timezone?: string;
  messages?: Messages;
}

interface ProvidersProps extends ProviderOptions {
  children: ReactNode;
}

/** The providers App puts around every screen: the brand theme and the i18n context. */
function Providers({
  branding = null,
  themeMode = 'light',
  locale = 'en',
  timezone = 'UTC',
  messages = {},
  children,
}: Readonly<ProvidersProps>): ReactElement {
  return (
    <I18nProvider locale={locale} messages={messages} settings={{ timezone }}>
      <ThemeProvider theme={buildTheme(branding, themeMode)}>{children}</ThemeProvider>
    </I18nProvider>
  );
}

/**
 * Wraps `element` in the theme and i18n providers, for components that read either. Pass the
 * result to `mount` (whole-screen, installs the fake bridge) or `render` (bare component).
 */
export function withProviders(element: ReactElement, options: ProviderOptions = {}): ReactElement {
  return <Providers {...options}>{element}</Providers>;
}
