import { useT } from '@exyconn/i18n';
import { Alert, Button, Stack, Text } from '@/components/ui';
import { LoadingState } from '@/components/feedback/CenteredState';
import type { DockBodyProps } from '@/components/compose-dock';
import { ConnectMailboxButtons } from './ConnectMailboxButtons';
import { SendEmailForm, type EmailDraft } from './forms/send-email';
import { useMyMailboxes } from './useMyMailboxes';

/** No mailbox of their own can send yet: why, and the way to connect one. */
function ConnectFirst({
  providers,
}: Readonly<{ providers: { gmail: boolean; microsoft: boolean } }>) {
  const t = useT();
  return (
    <Stack spacing={2}>
      <Text>
        {t(
          'Connect your own Gmail or Microsoft mailbox to send email from here. You connect it once; email goes out from your address and lands in your Sent folder.',
        )}
      </Text>
      <ConnectMailboxButtons providers={providers} />
    </Stack>
  );
}

/**
 * The email window's inside: the compose form once the person has a mailbox that can send,
 * else the way to connect one.
 */
export function EmailComposerBody({ panel, onClose }: Readonly<DockBodyProps>) {
  const t = useT();
  const { usable, providers, loading, error, refetch } = useMyMailboxes();
  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            {t('Retry')}
          </Button>
        }
      >
        {t('Your mailboxes could not be loaded.')}
      </Alert>
    );
  }
  if (usable.length === 0) {
    return <ConnectFirst providers={providers} />;
  }
  return (
    <SendEmailForm
      draft={panel.data as EmailDraft}
      mailboxes={usable}
      memoryKey={panel.key}
      onDone={onClose}
      onCancel={onClose}
    />
  );
}
