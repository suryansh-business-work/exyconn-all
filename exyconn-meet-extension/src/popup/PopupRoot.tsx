import { useEffect, useState } from 'react';
import type { Logger } from '@exyconn/logger';
import { AppProviders } from '../components/AppProviders';
import { usePrefs } from '../hooks/usePrefs';
import { DEFAULT_PREFS } from '../storage/prefs';
import { PopupApp } from './PopupApp';

/** The tab the popup was opened on (null on a page the extension cannot see). */
function useActiveTab(logger: Logger): number | null | undefined {
  const [tabId, setTabId] = useState<number | null | undefined>(undefined);
  useEffect(() => {
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => setTabId(tab?.id ?? null))
      .catch((error: unknown) => {
        logger.warn('Could not read the active tab', error);
        setTabId(null);
      });
  }, [logger]);
  return tabId;
}

export function PopupRoot({ logger }: Readonly<{ logger: Logger }>) {
  const { prefs } = usePrefs();
  const tabId = useActiveTab(logger);
  return (
    <AppProviders logger={logger} theme={(prefs ?? DEFAULT_PREFS).theme}>
      {tabId === undefined ? null : <PopupApp tabId={tabId} logger={logger} />}
    </AppProviders>
  );
}
