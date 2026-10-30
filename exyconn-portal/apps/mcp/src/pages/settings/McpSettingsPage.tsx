import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Skeleton } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import {
  McpEndpoint,
  useMcpServersQuery,
  useMcpSettingsQuery,
  useMcpSlackChannelsQuery,
} from '@exyconn/shell/graphql/generated';
import { McpSettingsForm } from './forms/mcp-settings';

/**
 * MCP Settings (admins): the company's rate limits, read-only servers and alerts. Every rule is
 * enforced by the server on the next call; the page only edits them.
 */
export function McpSettingsPage() {
  const t = useT();
  const navigate = useNavigate();
  const settings = useMcpSettingsQuery({ fetchPolicy: 'cache-and-network' });
  const servers = useMcpServersQuery();
  // Slack may not be set up: the form then offers notifications only.
  const channels = useMcpSlackChannelsQuery();
  const serverOptions = useMemo(
    () =>
      (servers.data?.mcpServers ?? [])
        .filter((server) => server.endpoint !== McpEndpoint.All)
        .map((server) => ({ value: server.endpoint, label: server.label })),
    [servers.data],
  );
  const channelOptions = useMemo(
    () =>
      (channels.data?.mcpSlackChannels ?? []).map((channel) => ({
        value: channel.id,
        label: `#${channel.name}`,
      })),
    [channels.data],
  );

  let body;
  if (settings.error) {
    body = <Alert severity="error">{settings.error.message}</Alert>;
  } else if (settings.data) {
    body = (
      <McpSettingsForm
        saved={settings.data.mcpSettings}
        servers={serverOptions}
        channels={channelOptions}
        onCancel={() => navigate('/mcp')}
      />
    );
  } else {
    body = <Skeleton variant="rounded" height={420} />;
  }

  return (
    <Box>
      <PageHeader
        title="MCP settings"
        subtitle="Rate limits, read-only servers and alerts for Claude across the company"
      />
      {channels.error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('Slack is not set up, so alerts go to admins’ notifications only.')}
        </Alert>
      )}
      {body}
    </Box>
  );
}
