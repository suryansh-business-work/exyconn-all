import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Stack, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { appUrl } from '@exyconn/shell/config/apps';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useMcpServersQuery, type McpServersQuery } from '@exyconn/shell/graphql/generated';

type ServerRow = McpServersQuery['mcpServers'][number] & { id: string };

/** The server's page in the MCP portal, e.g. mcp.exyconn.com/mcp/crm. */
const serverPage = (row: ServerRow) => appUrl('mcp', `/mcp/${row.endpoint.toLowerCase()}`);

function ConnectButton({ row }: Readonly<{ row: ServerRow }>) {
  const t = useT();
  return (
    <Button size="small" href={serverPage(row)} endIcon={<OpenInNewIcon fontSize="small" />}>
      {t('Connect')}
    </Button>
  );
}

const COLUMNS: Column<ServerRow>[] = [
  { key: 'label', label: 'Server' },
  {
    key: 'serverUrl',
    label: 'Address',
    render: (row) => (
      <Box component="span" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
        {row.serverUrl}
      </Box>
    ),
  },
  { key: 'toolCount', label: 'Tools' },
  {
    key: 'open',
    label: '',
    render: (row) => <ConnectButton row={row} />,
  },
];

/**
 * Developers › Claude (MCP): every module's MCP server address, and the way into the MCP portal
 * (mcp.exyconn.com), where connecting, tools, usage and connections are managed.
 */
export function McpPage() {
  const t = useT();
  const { data, loading, error, refetch } = useMcpServersQuery();
  const rows = (data?.mcpServers ?? []).map((row) => ({ ...row, id: row.endpoint }));

  return (
    <Box>
      <PageHeader
        title="Claude (MCP)"
        subtitle="Connect Claude to Exyconn: one MCP server per module, or one for everything"
      />
      <Stack spacing={2}>
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" href={appUrl('mcp', '/mcp')}>
              {t('Open the MCP portal')}
            </Button>
          }
        >
          <Text size="sm">
            {t(
              'In Claude, add a custom connector with a server address below. Claude signs in as you, and every tool runs with your own permissions. Tools, usage and connections are managed in the MCP portal.',
            )}
          </Text>
        </Alert>
        {error ? (
          <Alert severity="error">
            {errorMessage(error, t('The servers could not be loaded'))}
          </Alert>
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={rows}
            loading={!data && loading}
            onRefresh={() => refetch()}
            emptyMessage="No MCP servers are open to you."
          />
        )}
      </Stack>
    </Box>
  );
}
