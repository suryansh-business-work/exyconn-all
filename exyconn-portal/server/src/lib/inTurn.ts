/**
 * One conversation's work, one piece at a time. A person who taps two buttons quickly sends
 * two requests; running them side by side would let the second read the record before the
 * first saved it. Per process: the API runs as a single container.
 */
const tails = new Map<string, Promise<unknown>>();

export function inTurn<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(work);
  tails.set(key, next);
  const forget = () => {
    if (tails.get(key) === next) {
      tails.delete(key);
    }
  };
  next.then(forget, forget);
  return next;
}
