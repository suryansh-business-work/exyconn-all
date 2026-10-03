import { useCallback, useEffect, useState } from 'react';

/** How long each event stays current while a replay plays. */
const STEP_MS = 1200;
/** No event is current: the timeline reads as a plain log. */
const IDLE = -1;

export interface Replay {
  /** The event being replayed, or -1 when no replay has started. */
  index: number;
  playing: boolean;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  reset: () => void;
}

/**
 * Steps through a session's events one at a time, like watching it again. Play advances on a
 * timer and stops at the last event; Previous/Next step by hand (and pause), so the replay can
 * also be walked without any motion at all.
 */
export function useReplay(count: number): Replay {
  const [index, setIndex] = useState(IDLE);
  const [playing, setPlaying] = useState(false);
  const last = count - 1;
  const advancing = playing && index < last;

  useEffect(() => {
    if (!advancing) {
      return undefined;
    }
    const timer = globalThis.setTimeout(() => setIndex((current) => current + 1), STEP_MS);
    return () => globalThis.clearTimeout(timer);
  }, [advancing, index]);

  const play = useCallback(() => {
    // Playing again from the end starts over rather than doing nothing.
    setIndex((current) => (current >= last ? 0 : Math.max(current, 0)));
    setPlaying(true);
  }, [last]);
  const pause = useCallback(() => setPlaying(false), []);
  const next = useCallback(() => {
    setPlaying(false);
    setIndex((current) => Math.min(current + 1, last));
  }, [last]);
  const previous = useCallback(() => {
    setPlaying(false);
    setIndex((current) => Math.max(current - 1, 0));
  }, []);
  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(IDLE);
  }, []);

  return { index, playing: advancing, play, pause, next, previous, reset };
}
