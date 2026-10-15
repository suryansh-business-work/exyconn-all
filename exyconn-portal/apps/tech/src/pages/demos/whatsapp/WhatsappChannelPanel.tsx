import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Skeleton, Stack, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  WhatsappChannelDocument,
  useDeleteWhatsappChannelMutation,
  useWhatsappChannelQuery,
} from '@exyconn/shell/graphql/generated';
import { SetupSteps } from './SetupSteps';
import { WhatsappNumberForm, type WhatsappChannelRow } from './forms/whatsapp-number';

/** A failed load: what could not be read, why, and a Retry. Apollo has already reported it. */
function ChannelLoadError({
  error,
  onRetry,
}: Readonly<{ error: unknown; onRetry: () => Promise<unknown> }>) {
  const t = useT();
  const retry = () => {
    onRetry().catch((retryError: unknown) =>
      portalLogger.warn('tech: reloading the WhatsApp number failed', retryError),
    );
  };
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={retry}>
          {t('Retry')}
        </Button>
      }
    >
      {t('Could not load the WhatsApp number.')}{' '}
      {errorMessage(error, t('The server did not answer.'))}
    </Alert>
  );
}

/** Takes the number off the bot, after asking. */
function DisconnectButton({ channel }: Readonly<{ channel: WhatsappChannelRow }>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [remove, { loading }] = useDeleteWhatsappChannelMutation({
    refetchQueries: [WhatsappChannelDocument],
  });
  const onDisconnect = async () => {
    const ok = await confirm({
      title: 'Disconnect WhatsApp number',
      message:
        'Disconnect {number}? Messages to it will no longer be answered, and its stored token is deleted.',
      messageValues: { number: channel.displayPhone || channel.phoneNumberId },
      confirmText: 'Disconnect',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      await remove();
      notify('WhatsApp number disconnected', 'success');
    } catch (error) {
      portalLogger.warn('tech: disconnecting the WhatsApp number failed', error);
      notify(errorMessage(error, 'Could not disconnect the WhatsApp number'), 'error');
    }
  };
  return (
    <Button color="error" variant="outlined" onClick={onDisconnect} disabled={loading}>
      {t('Disconnect')}
    </Button>
  );
}

/**
 * Tech > Demos > WhatsApp bot: the company's real WhatsApp Business number, which answers
 * people with the same published workflows as the demo chat.
 */
export function WhatsappChannelPanel() {
  const t = useT();
  usePageTitle(t('WhatsApp number'));
  const { data, error, refetch } = useWhatsappChannelQuery({ fetchPolicy: 'cache-and-network' });
  const settings = data?.whatsappChannel;

  if (error) {
    return <ChannelLoadError error={error} onRetry={refetch} />;
  }
  if (!settings) {
    return (
      <Stack spacing={2} aria-busy>
        <Skeleton variant="rounded" height={280} />
        <Skeleton variant="rounded" height={360} />
      </Stack>
    );
  }
  const { channel } = settings;
  return (
    <Stack spacing={2}>
      <SetupSteps webhookUrl={settings.webhookUrl} verifyToken={channel?.verifyToken ?? null} />
      <Box sx={panel} component="section" aria-labelledby="wa-number-title">
        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography id="wa-number-title" variant="h6" component="h2">
            {t('Number settings')}
          </Typography>
          {channel && <DisconnectButton channel={channel} />}
        </Stack>
        <WhatsappNumberForm key={channel?.id ?? 'new'} initial={channel ?? null} />
      </Box>
    </Stack>
  );
}
