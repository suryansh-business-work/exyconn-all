import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslateMissingMutation } from '@/graphql/generated';

/**
 * How long misses are collected before they are sent.
 *
 * A screen reports every untranslated string it renders, which for a first paint is
 * hundreds of them arriving inside one tick. Batching turns that into one request.
 */
const BATCH_MS = 400;

/** Never ask about more than this in one go — the server translates a batch at a time. */
const MAX_BATCH = 50;

/**
 * Collects the strings a locale could not translate and asks the server to fill them in.
 *
 * Fire-and-forget by design: the page has already rendered in English and is perfectly
 * usable. What this buys is that the NEXT person to open the screen — or this one after a
 * reload — sees it in their own language, without anybody having prepared a catalogue.
 */
export function useMissingStrings(locale: string, enabled: boolean) {
  const [translate] = useTranslateMissingMutation();
  const pending = useRef(new Set<string>());
  const asked = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filled, setFilled] = useState(0);

  // A locale change makes everything asked for before it irrelevant.
  useEffect(() => {
    pending.current.clear();
    asked.current.clear();
  }, [locale]);

  const flush = useCallback(() => {
    const sources = [...pending.current].slice(0, MAX_BATCH);
    pending.current.clear();
    if (sources.length === 0) {
      return;
    }
    translate({ variables: { locale, sources } })
      .then(({ data }) => {
        // Only re-render when something actually came back, so a workspace with
        // auto-translation off does not spin.
        if ((data?.translateMissing.length ?? 0) > 0) {
          setFilled((count) => count + 1);
        }
      })
      .catch((error: unknown) => {
        console.error('Could not translate new strings', error);
      });
  }, [locale, translate]);

  const report = useCallback(
    (source: string) => {
      // Asked once, never asked again this session: a string the server could not translate
      // would otherwise be re-requested on every single render of the screen holding it.
      if (!enabled || asked.current.has(source)) {
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
    [enabled, flush],
  );

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  return { report, filled };
}
