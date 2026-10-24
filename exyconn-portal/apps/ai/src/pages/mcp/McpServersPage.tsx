import CableIcon from '@mui/icons-material/Cable';
import BuildIcon from '@mui/icons-material/Build';
import InsightsIcon from '@mui/icons-material/Insights';
import LinkIcon from '@mui/icons-material/Link';
import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { McpConnectTab } from './McpConnectTab';
import { McpConnectionsTab } from './McpConnectionsTab';
import { McpToolsTab } from './McpToolsTab';
import { McpUsageTab } from './McpUsageTab';
import { MCP_PATH } from './mcp.paths';

/**
 * AI > MCP Servers: the CRM as one MCP server for Claude — how to connect it, every tool it
 * offers, what it was used for, and who is connected.
 */
export function McpServersPage() {
  const t = useT();
  const tabs: TabberItem[] = [
    { slug: 'setup', label: t('Connect'), icon: <LinkIcon />, content: <McpConnectTab /> },
    { slug: 'tools', label: t('Tools'), icon: <BuildIcon />, content: <McpToolsTab /> },
    {
      slug: 'usage',
      label: t('Usage & billing'),
      icon: <InsightsIcon />,
      content: <McpUsageTab />,
    },
    {
      slug: 'connections',
      label: t('Connections'),
      icon: <CableIcon />,
      content: <McpConnectionsTab />,
    },
  ];
  return (
    <Box>
      <PageHeader
        title="MCP Servers"
        subtitle="Connect Claude to the CRM: every CRM feature as a tool, acting as you"
      />
      <Tabber basePath={MCP_PATH} items={tabs} ariaLabel="MCP server views" />
    </Box>
  );
}
