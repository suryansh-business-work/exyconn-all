import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useMaStartGoogleConnectMutation } from '@exyconn/shell/graphql/generated';

/**
 * Starts the Google Meet connection: asks the server for Google's consent page and goes there,
 * coming back to this page afterwards. Shared by the extension page and the calendar.
 */
export function useGoogleConnect() {
  const notify = useNotify();
  const [startConnect, { loading }] = useMaStartGoogleConnectMutation();
  const connect = async () => {
    try {
      const result = await startConnect({ variables: { returnTo: globalThis.location.href } });
      const url = result.data?.maStartGoogleConnect;
      if (url) {
        globalThis.location.assign(url);
      }
    } catch (error) {
      notify(errorMessage(error, 'Google sign-in could not be started.'), 'error');
    }
  };
  return { connect, connecting: loading };
}
