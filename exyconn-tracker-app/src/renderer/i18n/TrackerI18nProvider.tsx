import type { ReactElement, ReactNode } from 'react';
import { I18nProvider } from '@exyconn/i18n';
import { deviceLocale } from '@exyconn/tracker-core';
import useTrackerTranslations from './useTrackerTranslations';

interface Props {
  /** The language the portal resolved for this employee; this machine's until it lands. */
  locale: string | null;
  timezone: string;
  children: ReactNode;
}

/**
 * Puts the employee's own language in front of the whole app.
 *
 * Signed out there is no portal answer yet, so the app reads in the language of the machine
 * it is installed on — which for a tracker is nearly always the right one, and is the only
 * thing available before anyone has signed in.
 */
export default function TrackerI18nProvider({
  locale,
  timezone,
  children,
}: Readonly<Props>): ReactElement {
  const language = locale ?? deviceLocale();
  const { messages, report } = useTrackerTranslations(language);

  return (
    <I18nProvider locale={language} messages={messages} onMissing={report} settings={{ timezone }}>
      {children}
    </I18nProvider>
  );
}
