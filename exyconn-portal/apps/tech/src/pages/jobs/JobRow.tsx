import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, Text, borderWidth, fontWeight } from '@exyconn/shell/components/ui';
import type { BackgroundJob } from './JobsPage';

interface JobRowProps {
  job: BackgroundJob;
  busy: boolean;
  formatDateTime: (value: string | null | undefined) => string;
  onRun: () => void;
}

/** One loop: what it does, when it last ticked, and what that tick did. */
export function JobRow({ job, busy, formatDateTime, onRun }: Readonly<JobRowProps>) {
  const t = useT();
  return (
    <Box sx={{ py: 1, borderTop: `${borderWidth.hairline}px solid`, borderColor: 'divider' }}>
      <Flex
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text size="sm" weight="semibold">
          {t(job.label)}
        </Text>
        <Button size="small" variant="outlined" onClick={onRun} disabled={busy}>
          {t('Run now')}
        </Button>
      </Flex>
      <Text size="caption" color="text.secondary">
        {t(job.description)}
      </Text>
      <Text
        size="caption"
        color="text.secondary"
        sx={{ display: 'block', fontWeight: fontWeight.semibold }}
      >
        {job.lastRunAt
          ? t('Last run {when} — {summary}', {
              when: formatDateTime(job.lastRunAt),
              summary: job.lastRunSummary || t('nothing to report'),
            })
          : t('Not since this server started')}
      </Text>
    </Box>
  );
}
