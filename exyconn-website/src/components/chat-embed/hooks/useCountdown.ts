import { useEffect, useState } from "react";

/** Whole seconds left until `deadline` (ms since the epoch); null when there is none. */
function secondsUntil(deadline: number): number | null {
  return Number.isNaN(deadline) ? null : Math.max(0, Math.round((deadline - Date.now()) / 1000));
}

/** Whole seconds until `iso`, ticking every second; null when there is no deadline. */
export function useCountdown(iso: string | null): number | null {
  const deadline = iso ? Date.parse(iso) : Number.NaN;
  const [seconds, setSeconds] = useState(() => secondsUntil(deadline));

  useEffect(() => {
    setSeconds(secondsUntil(deadline));
    if (Number.isNaN(deadline)) {
      return undefined;
    }
    const timer = setInterval(() => setSeconds(secondsUntil(deadline)), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  return seconds;
}
