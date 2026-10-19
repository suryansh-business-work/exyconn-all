import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { appUrl } from '@exyconn/shell/config/apps';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useTestGmailConfigMutation,
  type GmailConfigFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** Where the CRM connects, turns on and disconnects its Gmail accounts. */
const CRM_GMAIL_PATH = '/integrations/email';

/**
 * How many mailboxes the CRM has connected with this client, a link to manage them in the CRM,
 * and a Test that reads every enabled mailbox's address.
 */
export function GmailConnection({ config }: Readonly<{ config: GmailConfigFieldsFragment }>) {
  const t = useT();
  const notify = useNotify();
  const [test, { loading: testing }] = useTestGmailConfigMutation();

  const onTest = async () => {
    try {
      const { data } = await test();
      notify(data?.testGmailConfig ?? 'Gmail answered', 'success');
    } catch (error) {
      portalLogger.warn('tech: the Gmail test failed', error);
      notify(errorMessage(error, 'The Gmail test failed'), 'error');
    }
  };

  const hasAccounts = config.accountCount > 0;
  return (
    <Flex direction="column" spacing={1.5} sx={{ mb: 2 }}>
      <Alert severity={hasAccounts ? 'success' : 'info'}>
        {hasAccounts
          ? t('{count} Gmail accounts connected in the CRM.', { count: config.accountCount })
          : t('No Gmail account connected yet. Save the client, then connect accounts in the CRM.')}
      </Alert>
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="contained" href={appUrl('crm', CRM_GMAIL_PATH)}>
          {t('Manage accounts in the CRM')}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            onTest().catch((error: unknown) => portalLogger.warn('tech: Gmail test failed', error));
          }}
          loading={testing}
          disabled={!hasAccounts}
        >
          {t('Test')}
        </Button>
      </Flex>
    </Flex>
  );
}
