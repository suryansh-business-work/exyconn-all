import { format } from 'date-fns';
import { useT } from '@exyconn/i18n';
import { Alert, Box, CircularProgress, Flex, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { formatBytes } from '@exyconn/shell/utils/file';
import { useDockerContainerDetailQuery } from '@exyconn/shell/graphql/generated';
import { formatDuration } from './infrastructure.format';

interface ContainerDetailDialogProps {
  containerId: string | null;
  name: string;
  onClose: () => void;
}

/** Seconds a container has been up, from the timestamp the engine reports. */
function uptimeSeconds(startedAt: string | null | undefined): number {
  if (!startedAt) {
    return 0;
  }
  return Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);
}

/**
 * Everything the engine knows about one container, plus a live CPU/memory sample.
 * Loaded only when a row is opened — the sample costs the engine a two-second read.
 */
export function ContainerDetailDialog({
  containerId,
  name,
  onClose,
}: Readonly<ContainerDetailDialogProps>) {
  const t = useT();
  const { data, loading, error } = useDockerContainerDetailQuery({
    variables: { id: containerId ?? '' },
    skip: !containerId,
    fetchPolicy: 'network-only',
  });

  const detail = data?.dockerContainerDetail;
  const cpuLimit = detail?.cpuLimit
    ? t('{cores} cores', { cores: detail.cpuLimit })
    : t('unlimited');
  const memoryLimit = detail?.memoryLimitBytes
    ? formatBytes(detail.memoryLimitBytes)
    : t('unlimited');

  return (
    <CrudDialog open={Boolean(containerId)} title={name} onClose={onClose}>
      {error && <Alert severity="error">{error.message}</Alert>}
      {loading && !detail && <CircularProgress size={24} />}
      {detail && (
        <Flex direction="column" spacing={1}>
          <DetailRow label={t('State')}>
            <StatusChip value={detail.state} />
          </DetailRow>
          <DetailRow label={t('Health')}>
            <StatusChip value={detail.health} />
          </DetailRow>
          <DetailRow label={t('Image')}>
            <Text size="sm" sx={{ wordBreak: 'break-all' }}>
              {detail.image}
            </Text>
          </DetailRow>
          <DetailRow label={t('Deployed tag')}>
            <Text size="sm">{detail.imageTag}</Text>
          </DetailRow>
          <DetailRow label={t('Image ID')}>
            <Text size="sm" sx={{ wordBreak: 'break-all' }}>
              {detail.imageId}
            </Text>
          </DetailRow>
          <DetailRow label={t('Container ID')}>
            <Text size="sm">{detail.id.slice(0, 12)}</Text>
          </DetailRow>
          <DetailRow label={t('Command')}>
            <Text size="sm" sx={{ wordBreak: 'break-all' }}>
              {detail.command}
            </Text>
          </DetailRow>
          <DetailRow label={t('Created')}>
            <Text size="sm">{format(new Date(detail.createdAt), 'PPpp')}</Text>
          </DetailRow>
          <DetailRow label={t('Uptime')}>
            <Text size="sm">{formatDuration(uptimeSeconds(detail.startedAt))}</Text>
          </DetailRow>
          <DetailRow label={t('Restarts')}>
            <Text size="sm">
              {t('{count} (policy: {policy})', {
                count: detail.restartCount,
                policy: detail.restartPolicy,
              })}
            </Text>
          </DetailRow>
          <DetailRow label={t('Exit code')}>
            <Text size="sm">{detail.exitCode}</Text>
          </DetailRow>
          <DetailRow label={t('CPU now')}>
            <Text size="sm">
              {t('{percent}% of {limit}', { percent: detail.cpuPercent, limit: cpuLimit })}
            </Text>
          </DetailRow>
          <DetailRow label={t('Memory now')}>
            <Text size="sm">
              {t('{used} of {limit}', {
                used: formatBytes(detail.memoryBytes),
                limit: memoryLimit,
              })}
            </Text>
          </DetailRow>
          <DetailRow label={t('Networks')}>
            <Text size="sm">{detail.networks.join(', ') || '—'}</Text>
          </DetailRow>
          <DetailRow label={t('Internal IP')}>
            <Text size="sm">{detail.ipAddress || '—'}</Text>
          </DetailRow>
          <DetailRow label={t('Log driver')}>
            <Text size="sm">{detail.logDriver || '—'}</Text>
          </DetailRow>
          {detail.mounts.map((mount) => (
            <DetailRow key={mount.destination} label={t('Mount {type}', { type: mount.type })}>
              <Box sx={{ textAlign: 'right' }}>
                <Text size="sm" sx={{ wordBreak: 'break-all' }}>
                  {t('{source} → {destination}', {
                    source: mount.source || t('(anonymous)'),
                    destination: mount.destination,
                  })}
                </Text>
                <Text size="caption" color="text.secondary">
                  {mount.readOnly ? t('read-only') : t('read-write')}
                </Text>
              </Box>
            </DetailRow>
          ))}
        </Flex>
      )}
    </CrudDialog>
  );
}
