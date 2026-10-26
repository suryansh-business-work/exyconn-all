import CableIcon from '@mui/icons-material/Cable';
import BuildIcon from '@mui/icons-material/Build';
import HistoryIcon from '@mui/icons-material/History';
import InsightsIcon from '@mui/icons-material/Insights';
import LinkIcon from '@mui/icons-material/Link';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Skeleton } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import type { McpEndpoint } from '@exyconn/shell/graphql/generated';
import { McpActivityTab } from './McpActivityTab';
import { McpConnectTab } from './McpConnectTab';
import { McpConnectionsTab } from './McpConnectionsTab';
import { McpToolsTab } from './McpToolsTab';
import { McpUsageTab } from './McpUsageTab';
import { useMcpServer } from './useMcpServer';
import { serverPath } from '../mcp.paths';

/** The tabs of one server, each a slug under its page. */
function serverTabs(endpoint: McpEndpoint, t: (text: string) => string): TabberItem[] {
  return [
    {
      slug: 'setup',
      label: t('Connect'),
      icon: <LinkIcon />,
      content: <McpConnectTab endpoint={endpoint} />,
    },
    {
      slug: 'tools',
      label: t('Tools'),
      icon: <BuildIcon />,
      content: <McpToolsTab endpoint={endpoint} />,
    },
    {
      slug: 'usage',
      label: t('Usage & billing'),
      icon: <InsightsIcon />,
      content: <McpUsageTab endpoint={endpoint} />,
    },
    {
      slug: 'activity',
      label: t('Claude (MCP) activity'),
      icon: <HistoryIcon />,
      content: <McpActivityTab endpoint={endpoint} />,
    },
    {
      slug: 'connections',
      label: t('Connections'),
      icon: <CableIcon />,
      content: <McpConnectionsTab endpoint={endpoint} />,
    },
  ];
}

/**
 * One MCP server — CRM, Marketing, or All (every module's tools in one connection): how to
 * connect it, every tool it offers, what it was used for, its activity log and who is connected.
 */
export function McpServerPage({ endpoint }: Readonly<{ endpoint: McpEndpoint }>) {
  const t = useT();
  const { server, loading, error, loaded } = useMcpServer(endpoint);
  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  if (!server) {
    if (loading || !loaded) {
      return <Skeleton variant="rounded" height={260} />;
    }
    return <Alert severity="warning">{t('You do not have access to this MCP server.')}</Alert>;
  }
  return (
    <Box>
      <PageHeader
        title="{server} MCP server"
        titleValues={{ server: server.label }}
        subtitle="Connect Claude: every feature as a tool, acting as you"
      />
      <Tabber
        basePath={serverPath(endpoint)}
        items={serverTabs(endpoint, t)}
        ariaLabel="MCP server views"
      />
    </Box>
  );
}
