import { useNavigate } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import { Button, Card, Grid, Stack, Text } from '@exyconn/shell/components/ui';
import type { McpServersQuery } from '@exyconn/shell/graphql/generated';
import { serverPath } from '../mcp.paths';

type Server = McpServersQuery['mcpServers'][number];

/** One server as a card: what it offers, its tools and connections, and a way in. */
function ServerCard({ server }: Readonly<{ server: Server }>) {
  const t = useT();
  const navigate = useNavigate();
  const { formatNumber } = useFormatters();
  return (
    <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Stack spacing={1} sx={{ height: '100%' }}>
        <Text component="h2" size="md" weight="bold">
          {t(server.label)}
        </Text>
        <Text size="sm" color="text.secondary" sx={{ flexGrow: 1 }}>
          {server.description}
        </Text>
        <Text size="sm">
          {t('{tools} tools · {connections} connections', {
            tools: formatNumber(server.toolCount),
            connections: formatNumber(server.connectionCount),
          })}
        </Text>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={() => navigate(serverPath(server.endpoint, 'setup'))}
          >
            {t('Connect')}
          </Button>
          <Button onClick={() => navigate(serverPath(server.endpoint, 'activity'))}>
            {t('Activity')}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

/** Every server the person may use, one card each, the global one last. */
export function McpServerCards({ servers }: Readonly<{ servers: readonly Server[] }>) {
  return (
    <Grid container spacing={2}>
      {servers.map((server) => (
        <Grid key={server.endpoint} size={{ xs: 12, md: 4 }}>
          <ServerCard server={server} />
        </Grid>
      ))}
    </Grid>
  );
}
