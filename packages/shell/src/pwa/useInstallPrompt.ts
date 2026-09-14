import { useCallback, useEffect, useState } from 'react';

/** The event Chromium fires instead of showing its own install bar. Not in lib.dom yet. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Whether this portal can be installed right now, and how to ask. */
export interface InstallPrompt {
  available: boolean;
  install: () => void;
}

/**
 * Offers to install this portal as an app, but only where the browser says it can be.
 *
 * The browser fires `beforeinstallprompt` when the page qualifies and the person has not
 * installed it already; holding on to that event is the only way to ask later, from a button
 * somebody chose to press, rather than through whatever banner the browser felt like showing.
 *
 * Safari fires nothing — there, installing is Share › Add to Home Screen, and no button we
 * could draw would do it — so the affordance simply does not appear.
 */
export function useInstallPrompt(): InstallPrompt {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const capture = (fired: Event) => {
      fired.preventDefault();
      setEvent(fired as InstallPromptEvent);
    };
    const installed = () => setEvent(null);
    globalThis.addEventListener('beforeinstallprompt', capture);
    globalThis.addEventListener('appinstalled', installed);
    return () => {
      globalThis.removeEventListener('beforeinstallprompt', capture);
      globalThis.removeEventListener('appinstalled', installed);
    };
  }, []);

  const install = useCallback(() => {
    if (!event) {
      return;
    }
    // One prompt per event: the browser refuses a second, and it will fire another when the
    // page next qualifies.
    setEvent(null);
    event.prompt().catch(() => undefined);
  }, [event]);

  return { available: event !== null, install };
}
