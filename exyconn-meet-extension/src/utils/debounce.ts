export interface Debounced {
  /** Asks for a run; repeated asks within `waitMs` collapse into one. */
  schedule(): void;
  /** Drops a pending run. */
  cancel(): void;
}

/**
 * Trailing-edge debounce with a ceiling: a page that never stops changing (Meet's tiles)
 * still runs `run` at least every `maxWaitMs`, so detection cannot starve.
 */
export function debounce(run: () => void, waitMs: number, maxWaitMs: number): Debounced {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let firstAskAt: number | null = null;

  const fire = (): void => {
    timer = null;
    firstAskAt = null;
    run();
  };

  return {
    schedule() {
      const now = Date.now();
      firstAskAt ??= now;
      if (timer !== null) {
        clearTimeout(timer);
      }
      const remaining = Math.max(0, firstAskAt + maxWaitMs - now);
      timer = setTimeout(fire, Math.min(waitMs, remaining));
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = null;
      firstAskAt = null;
    },
  };
}
