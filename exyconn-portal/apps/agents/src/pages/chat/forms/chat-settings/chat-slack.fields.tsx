import { useT } from '@exyconn/i18n';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { Box, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { env } from '@exyconn/shell/config/env';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';
import { SettingsSection } from './SettingsSection';

/** Where Slack posts thread replies: the portal API itself, next to /graphql. */
const slackEventsUrl = (): string =>
  new URL('/slack/events', new URL(env.graphqlUrl, globalThis.location.href)).toString();

/** The Request URL to paste into the Slack app, with a copy button. */
function RequestUrl({ url }: Readonly<{ url: string }>) {
  const t = useT();
  const notify = useNotify();
  const copy = () => {
    copyToClipboard(url)
      .then((copied) => notify(copied ? 'Request URL copied' : 'Copy failed', 'info'))
      .catch(() => notify('Copy failed', 'info'));
  };
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 1.5, py: 1 }}>
      <Text size="caption" color="text.secondary" component="div">
        {t('Event Subscriptions Request URL')}
      </Text>
      <Flex direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Text size="sm" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
          {url}
        </Text>
        <Tooltip title={t('Copy the Request URL')}>
          <IconButton size="small" aria-label={t('Copy the Request URL')} onClick={copy}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Flex>
    </Box>
  );
}

/** Mirroring each chat into a Slack DM thread with its assigned agent. */
export function ChatSlackFields() {
  const t = useT();
  return (
    <SettingsSection
      title="Slack"
      description="Let agents follow and answer their chats from Slack."
    >
      <Box>
        <RhfSwitch name="slackEnabled" label="Notify the assigned agent on Slack" />
        <Text size="sm" color="text.secondary" component="p">
          {t(
            'The assigned agent gets a Slack DM thread for each chat. Visitor messages are mirrored there, and replies in the thread reach the visitor.',
          )}
        </Text>
      </Box>
      <Text size="sm" color="text.secondary" component="p">
        {t(
          'Replies from Slack need a signing secret in Tech > Environment Variables > Slack, and the Slack app’s Event Subscriptions set to the Request URL below, subscribed to the message.im event. The app needs the scopes chat:write, users:read, users:read.email and im:history.',
        )}
      </Text>
      <RequestUrl url={slackEventsUrl()} />
    </SettingsSection>
  );
}
