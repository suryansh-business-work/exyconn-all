import { useT } from '@exyconn/i18n';
import { Box, Chip, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useWebsiteChatSettingsQuery } from '@exyconn/shell/graphql/generated';
import { ChatSettingsForm } from '../forms/chat-settings';

/** Whether the team is on duty right now, by the saved opening hours. */
function OnlineChip({ online }: Readonly<{ online: boolean }>) {
  const t = useT();
  return (
    <Chip
      role="status"
      color={online ? 'success' : 'default'}
      label={online ? t('Online now') : t('Offline now')}
    />
  );
}

/**
 * Website > Chatbot > Settings — the widget's switch, its messages, the team's opening hours,
 * the handoff to the Knowledge Bot and the upload rules.
 */
export function ChatSettingsPage() {
  const t = useT();
  const { data, loading, error } = useWebsiteChatSettingsQuery();
  const settings = data?.websiteChatSettings;

  let body;
  if (settings) {
    body = <ChatSettingsForm initial={settings} />;
  } else if (loading) {
    body = <LoadingState label="Loading the chatbot settings" />;
  } else {
    body = (
      <Text size="sm" color="error" role="alert">
        {errorMessage(error, t('The chatbot settings could not be loaded.'))}
      </Text>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Chatbot settings"
        subtitle="The chat widget on exyconn.com and the tools site"
      >
        {settings && <OnlineChip online={settings.online} />}
      </PageHeader>
      <Box sx={[readingPanel, { maxWidth: 820 }]}>{body}</Box>
    </Box>
  );
}
