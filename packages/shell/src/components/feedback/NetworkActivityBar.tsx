import { useEffect, useState, useSyncExternalStore } from 'react';
import { useT } from '@exyconn/i18n';
import { LinearProgress } from '@/components/ui';
import { networkActivity } from '@/config/networkActivity';

/** A request that answers sooner than this never shows the bar — a flash reads as a glitch. */
const SHOW_AFTER_MS = 200;

/**
 * A thin bar along the top of the window while any server call is in flight.
 *
 * The one loader every screen gets for free: a save, a delete behind a confirm, a refetch
 * after a mutation, a lazy lookup — all of them answer here, whether or not the screen that
 * sent them draws a spinner of its own.
 */
export function NetworkActivityBar() {
  const t = useT();
  const busy = useSyncExternalStore(networkActivity.subscribe, networkActivity.getSnapshot) > 0;
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!busy) {
      return undefined;
    }
    const timer = globalThis.setTimeout(() => setShown(true), SHOW_AFTER_MS);
    return () => {
      globalThis.clearTimeout(timer);
      setShown(false);
    };
  }, [busy]);

  if (!busy || !shown) {
    return null;
  }
  return (
    <LinearProgress
      aria-label={t('Loading')}
      sx={{
        position: 'fixed',
        top: 0,
        insetInline: 0,
        height: 3,
        // Above dialogs too: most saves and deletes are sent from one.
        zIndex: (theme) => theme.zIndex.tooltip,
      }}
    />
  );
}
