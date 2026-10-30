import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';

/** Copies a call's trace id, saying whether it worked. */
export function useCopyTraceId(): (traceId: string) => void {
  const notify = useNotify();
  return (traceId) => {
    copyToClipboard(traceId)
      .then((ok) =>
        notify(ok ? 'Trace id copied' : 'Could not copy the trace id', ok ? 'success' : 'error'),
      )
      .catch(() => notify('Could not copy the trace id', 'error'));
  };
}
