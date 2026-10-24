import { useT } from '@exyconn/i18n';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Alert, Box, Button, Skeleton, Stack, Text, TextField } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useMcpOverviewQuery } from '@exyconn/shell/graphql/generated';

/** The steps in Claude, in order, with the address they need filled in. */
const STEPS = [
  'In Claude (claude.ai or the desktop app), open Settings > Connectors.',
  'Choose Add custom connector.',
  'Name: Exyconn CRM. MCP server URL: paste the address above. Choose Add.',
  'Choose Connect. Claude opens Exyconn: sign in with your portal account if asked, then choose Allow.',
  'Back in Claude, the connector shows as connected and every CRM tool is available in chats.',
];

/** How to connect Claude: the address to paste, and the steps, one per line. */
export function McpConnectTab() {
  const t = useT();
  const notify = useNotify();
  const { data, loading, error } = useMcpOverviewQuery();
  const overview = data?.mcpOverview;

  const copy = (url: string) => {
    globalThis.navigator.clipboard
      .writeText(url)
      .then(() => notify('Address copied', 'success'))
      .catch((err: unknown) => {
        portalLogger.warn('Could not copy the MCP address', err);
        notify('Could not copy. Select the address and copy it.', 'error');
      });
  };

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  if (!overview) {
    return loading ? <Skeleton variant="rounded" height={220} /> : null;
  }
  return (
    <Stack spacing={2}>
      <Text size="sm" color="text.secondary">
        {t(
          'One connector gives Claude every CRM feature ({tools} tools: {queries} to read, {mutations} to change). Claude acts as you, with your permissions, and everything it does is logged.',
          {
            tools: overview.toolCount,
            queries: overview.queryCount,
            mutations: overview.mutationCount,
          },
        )}
      </Text>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          label={t('MCP server URL')}
          value={overview.serverUrl}
          fullWidth
          size="small"
          slotProps={{ input: { readOnly: true } }}
        />
        <Button
          variant="contained"
          startIcon={<ContentCopyIcon />}
          onClick={() => copy(overview.serverUrl)}
        >
          {t('Copy')}
        </Button>
      </Stack>
      <Box component="ol" sx={{ pl: 3, m: 0 }}>
        {STEPS.map((step) => (
          <Box component="li" key={step} sx={{ mb: 1 }}>
            <Text size="sm">{t(step)}</Text>
          </Box>
        ))}
      </Box>
      <Alert severity="info">
        {t(
          'Claude checks the address, then the sign-in settings and the sign-in provider. If it says no server responded, check the address has no typo and ends in /mcp.',
        )}
      </Alert>
    </Stack>
  );
}
