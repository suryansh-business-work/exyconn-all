import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Link } from '@exyconn/shell/components/ui';
import { useCrmIntegrationStatusQuery } from '@exyconn/shell/graphql/generated';
import { EMAIL_INTEGRATIONS_PATH } from '../../../integrations/emailIntegrationsPath';

/**
 * A small pointer to CRM > Integrations > Email on a contact or company page while no mailbox is
 * connected. Connecting happens there only; nothing shows until the status has loaded.
 */
export function ConnectMailboxLink() {
  const t = useT();
  const { data } = useCrmIntegrationStatusQuery();
  const email = data?.crmIntegrationStatus.email;
  if (!email || email.gmail || email.microsoft) {
    return null;
  }
  return (
    <Link
      component={RouterLink}
      to={EMAIL_INTEGRATIONS_PATH}
      variant="body2"
      sx={{ display: 'inline-block', mb: 1 }}
    >
      {t('Connect an email account in Integrations')}
    </Link>
  );
}
