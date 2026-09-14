import type { ReactNode } from 'react';
import { I18nProvider } from '@exyconn/i18n';
import { deviceLocale } from '@exyconn/tracker-core';
import { useTranslations } from './useTranslations';

interface Props {
  /** The language the portal resolved for this employee; this phone's until it lands. */
  locale: string | null;
  timezone: string;
  children: ReactNode;
}

/**
 * Puts the employee's own language in front of the whole app.
 *
 * Signed out there is no portal answer yet, so the app reads in the language of the phone it
 * is installed on — which is the only thing available before anybody has signed in, and for a
 * personal phone is nearly always the right one.
 */
export function TrackerI18nProvider({ locale, timezone, children }: Readonly<Props>) {
  const language = locale ?? deviceLocale();
  const { messages, report } = useTranslations(language);

  return (
    <I18nProvider locale={language} messages={messages} onMissing={report} settings={{ timezone }}>
      {children}
    </I18nProvider>
  );
}
