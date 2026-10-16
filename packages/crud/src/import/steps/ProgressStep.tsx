import { useT } from '@exyconn/i18n';
import { LinearProgress, Stack, Text } from '@exyconn/shell/components/ui';

interface ProgressStepProps {
  done: number;
  total: number;
  cancelling: boolean;
}

/** Step 4: the import running, announced to screen readers as it moves. */
export function ProgressStep({ done, total, cancelling }: Readonly<ProgressStepProps>) {
  const t = useT();
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const status = t('Imported {done} of {total} rows', { done, total });
  return (
    <Stack spacing={2}>
      <LinearProgress variant="determinate" value={percent} aria-label={status} />
      <Text role="status" aria-live="polite">
        {status}
      </Text>
      {cancelling && (
        <Text size="sm" color="text.secondary">
          {t('Stopping after the rows being imported now…')}
        </Text>
      )}
    </Stack>
  );
}
