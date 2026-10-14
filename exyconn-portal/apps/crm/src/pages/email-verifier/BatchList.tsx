import { useT, useFormatters } from '@exyconn/i18n';
import { Box, LinearProgress, Paper, Stack, Text, Typography } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { EmailVerificationBatchesQuery } from '@exyconn/shell/graphql/generated';

type Batch = EmailVerificationBatchesQuery['emailVerificationBatches'][number];

/** One bulk check: its file, progress and what it found so far. */
function BatchRow({ batch }: Readonly<{ batch: Batch }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const percent = batch.total > 0 ? Math.round((batch.processed / batch.total) * 100) : 100;
  return (
    <Paper variant="outlined" component="li" sx={{ p: 2, listStyle: 'none' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" component="h3" sx={{ wordBreak: 'break-all' }}>
          {batch.name}
        </Typography>
        <StatusChip value={batch.status} />
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{ my: 1 }}
        aria-label={t('{processed} of {total} checked', {
          processed: batch.processed,
          total: batch.total,
        })}
      />
      <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
        {t(
          '{processed} of {total} checked · {verified} verified · {risky} risky · {invalid} invalid · {unknown} unknown',
          {
            processed: batch.processed,
            total: batch.total,
            verified: batch.verified,
            risky: batch.risky,
            invalid: batch.invalid,
            unknown: batch.unknown,
          },
        )}
      </Text>
      <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
        {t('Uploaded {when} by {who}', {
          when: formatDateTime(batch.createdAt),
          who: batch.createdBy,
        })}
      </Text>
    </Paper>
  );
}

/** The recent bulk checks, newest first. */
export function BatchList({ batches }: Readonly<{ batches: Batch[] }>) {
  const t = useT();
  if (batches.length === 0) {
    return <Text color="text.secondary">{t('No bulk checks yet.')}</Text>;
  }
  return (
    <Stack component="ol" spacing={1} sx={{ p: 0, m: 0 }}>
      {batches.map((batch) => (
        <BatchRow key={batch.id} batch={batch} />
      ))}
    </Stack>
  );
}
