import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { appUrl } from '@exyconn/shell/config/apps';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useTestMicrosoftMailConfigMutation } from '@exyconn/shell/graphql/generated';

/** Where the CRM connects, turns on and disconnects its Microsoft mailboxes. */
const CRM_EMAIL_INTEGRATIONS_PATH = '/integrations/email';

/**
 * How many mailboxes the CRM has connected through the Entra app, a link to manage them in the
 * CRM, and a Test that reads every enabled mailbox's address.
 */
export function MicrosoftMailConnection({ accountCount }: Readonly<{ accountCount: number }>) {
  const t = useT();
  const notify = useNotify();
  const [test, { loading: testing }] = useTestMicrosoftMailConfigMutation();

  const onTest = async () => {
    try {
      const { data } = await test();
      notify(data?.testMicrosoftMailConfig ?? 'Microsoft answered', 'success');
    } catch (error) {
      portalLogger.warn('tech: the Microsoft Mail test failed', error);
      notify(errorMessage(error, 'The Microsoft Mail test failed'), 'error');
    }
  };

  const hasAccounts = accountCount > 0;
  return (
    <Flex direction="column" spacing={1.5} sx={{ mb: 2 }}>
      <Alert severity={hasAccounts ? 'success' : 'info'}>
        {hasAccounts
          ? t('{count} Microsoft mailboxes connected in the CRM.', { count: accountCount })
          : t(
              'No Microsoft mailbox connected yet. Save the app, then connect mailboxes in the CRM.',
            )}
      </Alert>
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="contained" href={appUrl('crm', CRM_EMAIL_INTEGRATIONS_PATH)}>
          {t('Manage mailboxes in the CRM')}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            onTest().catch((error: unknown) =>
              portalLogger.warn('tech: Microsoft Mail test failed', error),
            );
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
