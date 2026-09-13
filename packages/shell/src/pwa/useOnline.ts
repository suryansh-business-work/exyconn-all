import { useEffect, useState } from 'react';

/**
 * Whether the browser thinks it can reach the network.
 *
 * It is a hint, not a promise — a captive portal and a dead VPN both report "online" — but it
 * is the difference between a screen that says "you are offline" and one that says nothing
 * while every query quietly fails, which is what an installed app does the moment somebody
 * walks into a lift.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => globalThis.navigator?.onLine ?? true);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    globalThis.addEventListener('online', goOnline);
    globalThis.addEventListener('offline', goOffline);
    return () => {
      globalThis.removeEventListener('online', goOnline);
      globalThis.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
