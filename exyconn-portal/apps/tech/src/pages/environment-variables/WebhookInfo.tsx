import { useT } from '@exyconn/i18n';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Alert, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';
import { webhookUrl } from './secret';

interface WebhookInfoProps {
  /** What the address is called in the gateway's dashboard. */
  title: string;
  /** The API path the gateway posts to, e.g. `/webhooks/paypal`. */
  path: string;
  /** What to do with the address, in a sentence. */
  description: string;
  /** The events to subscribe the webhook to, when the gateway asks for them. */
  events?: readonly string[];
}

/** The API address a gateway notifies, with a copy button and the events it needs. */
export function WebhookInfo({ title, path, description, events }: Readonly<WebhookInfoProps>) {
  const t = useT();
  const notify = useNotify();
  const url = webhookUrl(path);
  const copy = () => {
    copyToClipboard(url)
      .then((copied) => notify(copied ? 'Webhook URL copied' : 'Copy failed', 'info'))
      .catch(() => notify('Copy failed', 'info'));
  };

  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Text weight="semibold" component="div">
        {t(title)}
      </Text>
      <Text size="sm" component="p">
        {t(description)}
      </Text>
      <Flex direction="row" alignItems="center" spacing={1}>
        <Text size="sm" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
          {url}
        </Text>
        <Tooltip title={t('Copy the webhook URL')}>
          <IconButton size="small" aria-label={t('Copy the webhook URL')} onClick={copy}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Flex>
      {events && (
        <Text size="sm" component="p">
          {t('Events: {events}', { events: events.join(', ') })}
        </Text>
      )}
    </Alert>
  );
}
