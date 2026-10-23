import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { CONNECT_RESULT_PARAMS, MY_MAILBOX_PARAM, connectResultOf } from './mailboxConnect';

/**
 * Announces how connecting one of the person's own mailboxes went when the provider sends
 * them back, on whichever page they started from, then tidies the address. Renders nothing.
 */
export function MailboxConnectReturn() {
  const notify = useNotify();
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const result = connectResultOf(params);
    if (!result) {
      return;
    }
    if (result.failed) {
      notify('The mailbox was not connected: {reason}', 'error', { reason: result.text });
    } else {
      notify('Connected {email}. Email you send goes out from it.', 'success', {
        email: result.text,
      });
    }
    for (const name of [MY_MAILBOX_PARAM, ...CONNECT_RESULT_PARAMS]) {
      params.delete(name);
    }
    const rest = params.toString();
    navigate({ pathname, search: rest ? `?${rest}` : '', hash }, { replace: true });
  }, [search, pathname, hash, notify, navigate]);

  return null;
}
