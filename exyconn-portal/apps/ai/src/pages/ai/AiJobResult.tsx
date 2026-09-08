import { Alert, Divider, Flex, Text } from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { formatCostUsd } from './ai-jobs-grid';
import { AiJobProgress } from './AiJobProgress';
import { useAiJob } from './useAiJob';

/** Milliseconds in a second, for the latency read-out. */
const MS_PER_SECOND = 1000;

/**
 * What one run produced: the answer, the tokens and money it cost and how long it took —
 * or the reason it failed, which is the thing people actually reopen a job to read.
 *
 * A run is queued rather than performed inside the request now, so the dialog can open on
 * a job that has no answer yet; it polls until the worker settles it.
 */
export function AiJobResult({ id }: Readonly<{ id: string }>) {
  const { formatDateTime } = useSettings();
  const { job, loading, waiting } = useAiJob(id);

  if (!job) {
    return <Text size="sm">{loading ? 'Loading…' : 'This job is no longer available.'}</Text>;
  }

  return (
    <Flex direction="column" spacing={1.5}>
      <DetailRow label="Job">
        <Text size="sm" weight="medium">
          {job.name}
        </Text>
      </DetailRow>
      <DetailRow label="Status">
        <StatusChip value={job.status} />
      </DetailRow>
      <DetailRow label="Model">
        <Text size="sm">{job.model}</Text>
      </DetailRow>
      <DetailRow label="Run by">
        <Text size="sm">{job.createdByName || 'Not run yet'}</Text>
      </DetailRow>
      <DetailRow label="Tokens">
        <Text size="sm">
          {job.totalTokens.toLocaleString()} ({job.promptTokens.toLocaleString()} prompt +{' '}
          {job.completionTokens.toLocaleString()} completion)
        </Text>
      </DetailRow>
      <DetailRow label="Cost">
        <Text size="sm">{formatCostUsd(job.costUsd, Boolean(job.ranAt))}</Text>
      </DetailRow>
      <DetailRow label="Took">
        <Text size="sm">{(job.latencyMs / MS_PER_SECOND).toFixed(2)}s</Text>
      </DetailRow>
      <DetailRow label="Last run">
        <Text size="sm">{job.ranAt ? formatDateTime(job.ranAt) : 'Not run yet'}</Text>
      </DetailRow>

      <Divider />
      <Text size="label">Prompt</Text>
      <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
        {job.prompt}
      </Text>

      <Divider />
      <Text size="label">Response</Text>
      <AiJobProgress status={job.status} queuedAt={job.queuedAt} />
      {job.error && <Alert severity="error">{job.error}</Alert>}
      {!waiting && !job.error && (
        <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
          {job.response || 'Nothing yet — run the job to get an answer.'}
        </Text>
      )}
    </Flex>
  );
}
