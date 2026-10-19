import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';

/** The query parameters a provider's consent callback appends to the page it returns to. */
export interface OAuthReturnKeys {
  /** Holds the connected mailbox's address on success. */
  connected: string;
  /** Holds the reason on failure. */
  failed: string;
}

/** This page's address without the outcome of an earlier try, for the provider to come back to. */
export function oauthReturnAddress(keys: OAuthReturnKeys): string {
  const url = new URL(globalThis.location.href);
  url.searchParams.delete(keys.connected);
  url.searchParams.delete(keys.failed);
  return url.toString();
}

/**
 * Announces the outcome a consent callback put on the address once, then takes it off the
 * address so a reload does not announce it again. `success` may use `{email}`.
 */
export function useOAuthReturnNotice(keys: OAuthReturnKeys, success: string) {
  const notify = useNotify();
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const connected = params.get(keys.connected);
    const failed = params.get(keys.failed);
    if (failed === null) {
      if (connected === null) {
        return;
      }
      notify(success, 'success', { email: connected });
    } else {
      notify(failed, 'error');
    }
    const rest = new URLSearchParams(params);
    rest.delete(keys.connected);
    rest.delete(keys.failed);
    setParams(rest, { replace: true });
  }, [params, setParams, notify, keys.connected, keys.failed, success]);
}
