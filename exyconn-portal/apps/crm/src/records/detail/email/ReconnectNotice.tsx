import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Link } from '@exyconn/shell/components/ui';
import { GmailAccountStatus, useGmailAccountsQuery } from '@exyconn/shell/graphql/generated';
import { EMAIL_INTEGRATIONS_PATH } from '../../../integrations/emailIntegrationsPath';

/**
 * Says which enabled accounts Google refused, so a thread missing from the list is explained:
 * the other accounts' mail still shows.
 */
export function ReconnectNotice() {
  const t = useT();
  const { data } = useGmailAccountsQuery({ fetchPolicy: 'cache-and-network' });
  const refused = (data?.gmailAccounts ?? []).filter(
    (account) => account.enabled && account.status === GmailAccountStatus.NeedsReconnect,
  );
  if (refused.length === 0) {
    return null;
  }
  return (
    <Alert severity="warning">
      {t('These Gmail accounts need reconnecting, so their newest mail is missing: {emails}.', {
        emails: refused.map((account) => account.email).join(', '),
      })}{' '}
      <Link component={RouterLink} to={EMAIL_INTEGRATIONS_PATH}>
        {t('Reconnect in Integrations')}
      </Link>
    </Alert>
  );
}
