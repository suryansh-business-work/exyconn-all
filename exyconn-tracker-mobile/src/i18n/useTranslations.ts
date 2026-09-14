import { useCallback, useEffect, useRef, useState } from 'react';
import type { Messages } from '@exyconn/i18n';
import { portal } from '../tracker/platform';
import { logger } from '../tracker/logger';

/** Misses are collected for this long before they are sent, so one paint is one request. */
const BATCH_MS = 400;

/** Never ask about more than this at once — the portal translates a batch at a time. */
const MAX_BATCH = 50;

/**
 * The app's words in one language, and a way to fill in what it has never been asked for.
 *
 * The same contract as the desktop's and the portal's: the screen renders in English
 * immediately and swaps when the catalogue lands, and every string it could not translate is
 * reported so the next launch reads in the employee's own language.
 */
export function useTranslations(locale: string): {
  messages: Messages;
  report: (source: string) => void;
} {
  const [messages, setMessages] = useState<Messages>({});
  const pending = useRef(new Set<string>());
  const asked = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let live = true;
    // A language change makes everything asked for under the last one irrelevant.
    pending.current.clear();
    asked.current.clear();
    setMessages({});
    portal
      .fetchTranslations(locale)
      .then((loaded) => live && setMessages(loaded))
      .catch((error: unknown) => logger.error('Could not load translations', error));
    return () => {
      live = false;
    };
  }, [locale]);

  const flush = useCallback(() => {
    const sources = [...pending.current].slice(0, MAX_BATCH);
    pending.current.clear();
    if (sources.length === 0) {
      return;
    }
    portal
      .translateMissing(locale, sources)
      .then((filled) => {
        if (Object.keys(filled).length > 0) {
          setMessages((current) => ({ ...current, ...filled }));
        }
      })
      .catch((error: unknown) => logger.error('Could not translate new strings', error));
  }, [locale]);

  const report = useCallback(
    (source: string) => {
      // Asked once, never again this run: a string the portal cannot translate would
      // otherwise be re-requested on every render of the screen holding it.
      if (asked.current.has(source)) {
        return;
      }
      asked.current.add(source);
      pending.current.add(source);
      if (timer.current === null) {
        timer.current = setTimeout(() => {
          timer.current = null;
          flush();
        }, BATCH_MS);
      }
    },
    [flush],
  );

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  return { messages, report };
}
