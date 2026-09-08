import { useCallback, useEffect, useState } from 'react';
import {
  browserLocale,
  canonicalLocale,
  deviceTimezone,
  resolveEffectiveLocale,
  resolveEffectiveTimezone,
} from '@exyconn/i18n';
import { useAppSettingsQuery, useMeQuery } from '@/graphql/generated';

/**
 * Where a language chosen before signing in is kept.
 *
 * The login screen has a language picker and nobody to attach the choice to yet, so it
 * lives here until there is an account to save it on. Per browser, deliberately: it is a
 * convenience for this machine, not a preference the workspace should know about.
 */
const STORAGE_KEY = 'exyconn.locale';

function storedLocale(): string | null {
  try {
    return canonicalLocale(localStorage.getItem(STORAGE_KEY));
  } catch {
    // A browser with site data blocked must still render.
    return null;
  }
}

export interface LocalePreference {
  /** The locale every string and every formatter uses. */
  locale: string;
  /** The zone every date and time is rendered in. */
  timezone: string;
  /** Patterns and currency, straight from the workspace's settings. */
  dateFormat: string;
  timeFormat: string;
  /** Switches the language for this browser until the person saves it on their profile. */
  choose: (locale: string) => void;
  /** True once both the account and the workspace settings have been read. */
  ready: boolean;
}

/**
 * Which language and zone this screen renders in.
 *
 * The chain is the same one the server applies: the person's own pick, then the workspace
 * default, then what the browser and the device say. `me` is skipped while signed out —
 * the login screen still needs a language, and it comes from the browser.
 */
export function useLocalePreference(): LocalePreference {
  const { data: settingsData } = useAppSettingsQuery({ fetchPolicy: 'cache-first' });
  const { data: meData } = useMeQuery({ fetchPolicy: 'cache-first', errorPolicy: 'ignore' });
  const [override, setOverride] = useState<string | null>(storedLocale);

  const settings = settingsData?.appSettings;
  const me = meData?.me;

  // Signing in replaces a browser-local choice with the account's own, so the person's
  // saved preference wins over whatever this machine happened to be showing.
  useEffect(() => {
    if (me?.locale) {
      setOverride(null);
    }
  }, [me?.locale]);

  const choose = useCallback((next: string) => {
    const canonical = canonicalLocale(next);
    if (!canonical) {
      return;
    }
    setOverride(canonical);
    try {
      localStorage.setItem(STORAGE_KEY, canonical);
    } catch {
      // Nothing to do: the choice still applies for this page's lifetime.
    }
  }, []);

  return {
    locale: resolveEffectiveLocale({
      userLocale: override ?? me?.locale,
      defaultLocale: settings?.defaultLocale,
      browserLocale: browserLocale(),
    }),
    timezone: resolveEffectiveTimezone({
      userTimezone: me?.timezone,
      defaultTimezone: settings?.timezone,
      deviceTimezone: deviceTimezone(),
    }),
    dateFormat: settings?.dateFormat ?? 'dd MMM yyyy',
    timeFormat: settings?.timeFormat ?? 'hh:mm a',
    choose,
    ready: settingsData !== undefined,
  };
}
