import { useT } from '@exyconn/i18n';
import { Box, Button, Skeleton, Stack, Typography } from '@exyconn/shell/components/ui';
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
import { QueryErrorState } from '../shared/QueryErrorState';
import { SetupSteps } from './SetupSteps';
import { WhatsappNumberForm, type WhatsappChannelRow } from './forms/whatsapp-number';

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
      portalLogger.warn('wa-demo: disconnecting the WhatsApp number failed', error);
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
 * WhatsApp number: the company's real WhatsApp Business number, which answers people with
 * the same published workflows as the demo chat.
 */
export function ChannelTab() {
  const t = useT();
  usePageTitle(t('WhatsApp number'));
  const { data, error, refetch } = useWhatsappChannelQuery({ fetchPolicy: 'cache-and-network' });
  const settings = data?.whatsappChannel;

  if (error) {
    return (
      <QueryErrorState
        error={error}
        title="Could not load the WhatsApp number."
        onRetry={refetch}
      />
    );
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
