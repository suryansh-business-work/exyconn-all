import { useT } from '@exyconn/i18n';
import { Stack, Text } from '@exyconn/shell/components/ui';
import { GmailPanel } from './GmailPanel';
import { MicrosoftMailPanel } from './MicrosoftMailPanel';

/** Where the OAuth apps live; the old Gmail and Microsoft Mail addresses redirect here. */
export const EMAIL_ACCOUNTS_PATH = '/tech/environment-variables/email-accounts';

/**
 * Environment Variables > Email accounts (OAuth): the Google and Microsoft OAuth apps the CRM's
 * mailboxes connect through. CRM users only press Connect; everything they connect through is
 * set up here.
 */
export function EmailAccountsPanel() {
  const t = useT();
  return (
    <Stack spacing={2}>
      <Text size="sm" color="text.secondary">
        {t(
          'The OAuth apps CRM users connect their Gmail and Microsoft mailboxes through. Users only see a Connect button; it stays off until the app here is saved and turned on.',
        )}
      </Text>
      <GmailPanel />
      <MicrosoftMailPanel />
    </Stack>
  );
}
