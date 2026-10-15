import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { WhatsappChannelRow } from './forms/whatsapp-number';

/**
 * Whether messages to the real number reach the server, and if not, why: the last message Meta
 * delivered, or the last problem the server recorded (a wrong App secret, the number switched
 * off, a reply Meta refused). Without it a number that stays silent gives no clue at all.
 */
export function ChannelHealth({ channel }: Readonly<{ channel: WhatsappChannelRow }>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  if (channel.lastProblem) {
    return (
      <Alert severity="warning" role="status">
        {t('Last problem, {time}:', { time: formatDateTime(channel.lastProblemAt ?? '') })}{' '}
        {channel.lastProblem}
      </Alert>
    );
  }
  if (channel.lastInboundAt) {
    return (
      <Alert severity="success" role="status">
        {t('Messages are arriving. The last one came in {time}.', {
          time: formatDateTime(channel.lastInboundAt),
        })}
      </Alert>
    );
  }
  return (
    <Alert severity="info" role="status">
      {t(
        'No message has reached this server yet. Send Hi to the number: if nothing shows here within a minute, Meta is not delivering — check that the webhook is subscribed to the messages field and press Test.',
      )}
    </Alert>
  );
}
