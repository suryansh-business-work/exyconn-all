import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Button, Drawer, Link, Stack, Text } from '@exyconn/shell/components/ui';
import { DetailFact } from '@exyconn/shell/components/data/DetailFact';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { appUrl } from '@exyconn/shell/config/apps';
import type { McpActivityQuery } from '@exyconn/shell/graphql/generated';
import { useCopyTraceId } from './useCopyTraceId';

export type McpCallRow = McpActivityQuery['mcpActivity'][number];

/** Where a change made through Claude is filed, and where an unexpected failure is logged. */
function CallLinks({ row }: Readonly<{ row: McpCallRow }>) {
  const t = useT();
  return (
    <Stack spacing={0.5}>
      {row.kind === 'MUTATION' && row.ok && (
        <Link href={appUrl('admin', '/admin/audit')} target="_blank" rel="noopener">
          {t('The change in the audit log (search for the trace id)')}
        </Link>
      )}
      {row.errorCode === 'INTERNAL' && (
        <Link href={appUrl('tech', '/tech/logs')} target="_blank" rel="noopener">
          {t('The failure in Tech > Logs (search for the trace id)')}
        </Link>
      )}
    </Stack>
  );
}

/**
 * One call made through Claude, in full: who it acted for and from which client, through which
 * endpoint, what ran with which arguments (names only), how it ended and why, how long it took
 * and how big the answer was — with its trace id to copy and where else it was recorded.
 */
export function McpCallDrawer({
  row,
  onClose,
}: Readonly<{ row: McpCallRow | null; onClose: () => void }>) {
  const t = useT();
  const { formatDateTime, formatNumber } = useFormatters();
  const copyTraceId = useCopyTraceId();
  return (
    <Drawer
      anchor="right"
      open={row !== null}
      onClose={onClose}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-label': t('Call details'),
          sx: { width: { xs: '100%', sm: 440 }, maxWidth: '100%' },
        },
      }}
    >
      {row && (
        <Box sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Text component="h2" size="lg" weight="bold">
              {row.tool}
            </Text>
            <Stack direction="row" spacing={1}>
              <StatusChip value={row.kind} />
              <StatusChip value={row.ok ? 'DONE' : 'FAILED'} />
              {row.errorCode && <StatusChip value={row.errorCode} />}
            </Stack>
            <DetailFact label="When">{formatDateTime(row.at)}</DetailFact>
            <DetailFact label="Acted for">{row.userName}</DetailFact>
            <DetailFact label="Client">{row.clientName || '—'}</DetailFact>
            <DetailFact label="Module">{row.server}</DetailFact>
            <DetailFact label="Connected through">{row.endpoint ?? '—'}</DetailFact>
            <DetailFact label="Arguments given">{row.argNames.join(', ') || '—'}</DetailFact>
            <DetailFact label="Time (ms)">{formatNumber(row.durationMs)}</DetailFact>
            <DetailFact label="Answer size (characters)">
              {formatNumber(row.answerChars)}
              {row.truncated ? ` · ${t('rows left out to fit')}` : ''}
            </DetailFact>
            {row.error && <DetailFact label="Reason">{row.error}</DetailFact>}
            <DetailFact label="Trace id">{row.traceId || '—'}</DetailFact>
            {row.traceId && (
              <Button
                startIcon={<ContentCopyIcon />}
                onClick={() => copyTraceId(row.traceId)}
                sx={{ alignSelf: 'flex-start' }}
              >
                {t('Copy trace id')}
              </Button>
            )}
            <CallLinks row={row} />
          </Stack>
        </Box>
      )}
    </Drawer>
  );
}
