import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_FORMAT_SETTINGS, type FormatSettings } from './format';
import { FALLBACK_LOCALE, directionOf, type TextDirection } from './locale';
import { FALLBACK_TIMEZONE } from './timezone';
import { translate, type Interpolations, type Messages } from './translate';

export interface I18nValue {
  locale: string;
  direction: TextDirection;
  /** Everything a formatter needs: locale, zone, patterns and currency, in one object. */
  settings: FormatSettings;
  t: (source: string, values?: Interpolations) => string;
}

const EMPTY_MESSAGES: Messages = {};

const I18nContext = createContext<I18nValue>({
  locale: FALLBACK_LOCALE,
  direction: 'ltr',
  settings: DEFAULT_FORMAT_SETTINGS,
  t: (source, values) => translate(source, { messages: EMPTY_MESSAGES }, values),
});

interface Props {
  locale: string;
  messages: Messages;
  /** Reported for every string with no translation, so the caller can go and fetch them. */
  onMissing?: (source: string) => void;
  /** Zone, patterns and currency. Locale is taken from `locale`, never from here. */
  settings?: Omit<FormatSettings, 'locale'>;
  children: ReactNode;
}

/**
 * Puts one locale in front of a tree.
 *
 * Deliberately network-free: it is given messages and reports misses, and knows nothing
 * about where either comes from. That is what lets the design system, the portals and the
 * desktop app all use the same provider without any of them depending on the others.
 */
export function I18nProvider({ locale, messages, onMissing, settings, children }: Readonly<Props>) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      direction: directionOf(locale),
      settings: {
        locale,
        timezone: settings?.timezone ?? FALLBACK_TIMEZONE,
        dateFormat: settings?.dateFormat ?? DEFAULT_FORMAT_SETTINGS.dateFormat,
        timeFormat: settings?.timeFormat ?? DEFAULT_FORMAT_SETTINGS.timeFormat,
        currency: settings?.currency ?? DEFAULT_FORMAT_SETTINGS.currency,
      },
      t: (source, values) => translate(source, { messages, onMissing }, values),
    }),
    [locale, messages, onMissing, settings],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Everything about the current locale: `t`, the tag, the direction and the formatters' settings. */
export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

/**
 * Just the translator.
 *
 * The overwhelmingly common call, and the one the codemod writes, so it gets its own hook:
 * `const t = useT()` then `t('Save changes')`.
 */
export function useT(): (source: string, values?: Interpolations) => string {
  return useContext(I18nContext).t;
}
