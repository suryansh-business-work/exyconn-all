import { ApolloLink } from '@apollo/client';
import { defer, finalize } from 'rxjs';

/**
 * Operation context for a request nobody is waiting on — a poll, a log upload. Passed as
 * `context: BACKGROUND_REQUEST`, it keeps the request off the activity bar, which would
 * otherwise flicker every few seconds on a page that polls.
 */
export const BACKGROUND_REQUEST = { background: true } as const;

let inFlight = 0;
const listeners = new Set<() => void>();

function setInFlight(next: number): void {
  inFlight = next;
  listeners.forEach((listener) => listener());
}

/** The number of server calls in flight, as a store `useSyncExternalStore` can read. */
export const networkActivity = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: (): number => inFlight,
};

/**
 * Counts every GraphQL request from the moment it is sent until it settles — answered,
 * failed or cancelled — so one bar can say "working" for every server call in the portal,
 * including the ones whose screens show nothing of their own.
 */
export const activityLink = new ApolloLink((operation, forward) => {
  if (operation.getContext().background) {
    return forward(operation);
  }
  return defer(() => {
    setInFlight(inFlight + 1);
    return forward(operation).pipe(finalize(() => setInFlight(inFlight - 1)));
  });
});
