import { useCallback, useEffect, useRef, useState } from 'react';

/** Whether a newer build is waiting, and how to take it. */
export interface PwaUpdate {
  ready: boolean;
  apply: () => void;
}

/** Where the build writes its service worker. One per portal, at the origin's root. */
const SERVICE_WORKER_URL = '/sw.js';

/** Asks the waiting worker to take over now (the generated worker listens for this). */
const SKIP_WAITING = { type: 'SKIP_WAITING' };

/**
 * Registers this portal's service worker and watches for a newer build.
 *
 * The worker is asked to PROMPT rather than to swap itself in: these screens are mostly
 * forms, and a portal that reloaded itself under somebody halfway through an invoice would
 * lose their work to save them a click.
 *
 * Registration goes through the browser's own API rather than the plugin's helper, so no app
 * has to carry a runtime dependency to be installable. There is no worker in dev or under the
 * test runner, and nothing here should care.
 */
export function usePwaUpdate(): PwaUpdate {
  const [ready, setReady] = useState(false);
  const waiting = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    const container = globalThis.navigator?.serviceWorker;
    if (!container) {
      return;
    }
    let live = true;
    const offer = (worker: ServiceWorker | null) => {
      if (live && worker) {
        waiting.current = worker;
        setReady(true);
      }
    };

    container
      .register(SERVICE_WORKER_URL)
      .then((registration) => {
        // Already waiting: this tab was opened after a newer build was installed elsewhere.
        offer(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          installing?.addEventListener('statechange', () => {
            // "installed" with a controller means a replacement, not the first install —
            // there is nothing to announce to somebody who just arrived.
            if (installing.state === 'installed' && container.controller) {
              offer(installing);
            }
          });
        });
      })
      .catch(() => {
        // No worker in this build, or the browser refused it. The portal still works.
      });

    return () => {
      live = false;
    };
  }, []);

  const apply = useCallback(() => {
    setReady(false);
    const worker = waiting.current;
    if (!worker) {
      globalThis.location.reload();
      return;
    }
    // The new worker takes control, and the page reloads onto it once it has.
    globalThis.navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => globalThis.location.reload(),
      { once: true },
    );
    worker.postMessage(SKIP_WAITING);
  }, []);

  return { ready, apply };
}
