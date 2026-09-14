import { Link } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSendAdminCredentialsMutation } from '@exyconn/shell/graphql/generated';
import { useT } from '@exyconn/i18n';

/**
 * Escape hatch for a portal nobody can sign in to: asks the server to re-issue
 * the configured admin account and mail a fresh password to its configured
 * address. The server does nothing once any administrator exists, so this is
 * safe to expose on the public login screen.
 */
export function AdminRecovery() {
  const t = useT();
  const notify = useNotify();
  const [send, { loading }] = useSendAdminCredentialsMutation();

  const handleClick = async () => {
    try {
      const { data } = await send();
      notify(data?.sendAdminCredentials ?? 'Request sent.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not send credentials.', 'error');
    }
  };

  return (
    <Link
      component="button"
      type="button"
      variant="caption"
      disabled={loading}
      sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
      onClick={handleClick}
    >
      {loading ? t('Sending…') : t('No admin account? Email admin credentials')}
    </Link>
  );
}
