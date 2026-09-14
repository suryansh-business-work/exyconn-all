import type { ReactElement, ReactNode } from 'react';
import { useEffect } from 'react';
import { I18nProvider, directionOf } from '@exyconn/i18n';
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

  // The page's own language and direction (WCAG 3.1.1): a screen reader picks its voice from
  // `lang`, and an RTL language needs `dir` for everything MUI does not mirror itself.
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = directionOf(language);
  }, [language]);

  return (
    <I18nProvider locale={language} messages={messages} onMissing={report} settings={{ timezone }}>
      {children}
    </I18nProvider>
  );
}
