import { useCallback, useRef } from 'react';
import { useT } from '@exyconn/i18n';
import type { DemoUser, EngineContext } from '@exyconn/wa-flow/engine';
import { useReducedMotion } from '../theme/useWa';
import { useWaFormat } from './useWaFormat';

/** Typing delays shrink, but do not vanish, when the viewer asked for less motion. */
const REDUCED_TYPING = 0.4;

/** A getter for a fresh engine context — `now` is read at the moment of each event. */
export function useEngineContext(user: DemoUser, ai: boolean): () => EngineContext {
  const t = useT();
  const format = useWaFormat();
  const reduced = useReducedMotion();
  const latest = useRef({ user, ai, t, format, reduced });
  latest.current = { user, ai, t, format, reduced };
  return useCallback(() => {
    const { reduced: less, ...rest } = latest.current;
    return {
      ...rest,
      t: (source: string) => rest.t(source),
      now: Date.now(),
      typingScale: less ? REDUCED_TYPING : 1,
    };
  }, []);
}
