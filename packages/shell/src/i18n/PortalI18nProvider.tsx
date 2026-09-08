import { useEffect, useMemo, type ReactNode } from 'react';
import { I18nProvider, type Messages } from '@exyconn/i18n';
import { useLocaleBundleQuery } from '@/graphql/generated';
import { useLocalePreference } from './useLocalePreference';
import { useMissingStrings } from './useMissingStrings';

/** The currency the portal's money is in. Workspace-wide, like its date patterns. */
const CURRENCY = 'INR';

interface Props {
  children: ReactNode;
}

/**
 * Wires `@exyconn/i18n` to the portal: resolves which language and zone this person reads
 * in, loads that language's translations, and reports back anything it could not translate
 * so the language fills itself in.
 *
 * Never blocks rendering on the bundle. The screen paints in English immediately and swaps
 * to the translation when it lands — a portal that showed a spinner until a translation
 * arrived would be slower in every language than the one it replaced.
 */
export function PortalI18nProvider({ children }: Readonly<Props>) {
  const preference = useLocalePreference();
  const { locale, timezone, dateFormat, timeFormat } = preference;

  const { data, refetch } = useLocaleBundleQuery({
    variables: { locale },
    fetchPolicy: 'cache-and-network',
  });

  const { report, filled } = useMissingStrings(locale, preference.ready);

  const messages = useMemo<Messages>(() => {
    const entries = data?.localeBundle.translations ?? [];
    return Object.fromEntries(entries.map((entry) => [entry.source, entry.text]));
  }, [data]);

  // A round of machine translation just landed on the server; pick it up.
  useEffect(() => {
    if (filled > 0) {
      refetch().catch((error: unknown) => console.error('Could not reload translations', error));
    }
  }, [filled, refetch]);

  const settings = useMemo(
    () => ({ timezone, dateFormat, timeFormat, currency: CURRENCY }),
    [timezone, dateFormat, timeFormat],
  );

  return (
    <I18nProvider locale={locale} messages={messages} onMissing={report} settings={settings}>
      {children}
    </I18nProvider>
  );
}
