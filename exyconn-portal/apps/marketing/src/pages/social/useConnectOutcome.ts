import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';

/**
 * The provider sends the browser back here with `?connected=META&count=2` or `?error=…`.
 * Announces it once, then clears it from the address so a reload does not repeat it.
 */
export function useConnectOutcome(onConnected: () => void): void {
  const [params, setParams] = useSearchParams();
  const notify = useNotify();
  // The latest callbacks, so the effect runs once per outcome rather than once per render.
  const latest = useRef({ notify, onConnected });
  latest.current = { notify, onConnected };
  const connected = params.get('connected');
  const error = params.get('error');
  const count = params.get('count') ?? '1';

  useEffect(() => {
    if (!connected && !error) return;
    if (connected) {
      latest.current.notify('Connected {count} account(s)', 'success', { count });
      latest.current.onConnected();
    } else {
      latest.current.notify(error ?? 'The connection failed', 'error');
    }
    setParams({}, { replace: true });
  }, [connected, error, count, setParams]);
}
