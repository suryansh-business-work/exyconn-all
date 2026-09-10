import { borderWidth, Box, Chip, Stack, Typography } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import type { SystemHealthQuery } from '@exyconn/shell/graphql/generated';

type HealthJob = SystemHealthQuery['systemHealth']['jobs'][number];

interface JobRowProps {
  job: HealthJob;
  formatDateTime: (value: string | null | undefined) => string;
}

/** One background loop: what it is, whether it has work, and when it last ticked. */
function JobRow({ job, formatDateTime }: Readonly<JobRowProps>) {
  const stateLabel = job.enabled ? 'Enabled' : 'Off';
  const lastRun = job.lastRunAt ? formatDateTime(job.lastRunAt) : 'Not since restart';
  return (
    <Box sx={{ py: 1, borderTop: `${borderWidth.hairline}px solid`, borderColor: 'divider' }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: "space-between",
          alignItems: "center"
        }}>
        <Typography variant="body2" sx={{
          fontWeight: 600
        }}>
          {job.label}
        </Typography>
        <Chip
          size="small"
          label={stateLabel}
          color={job.enabled ? 'success' : 'default'}
          variant="outlined"
        />
      </Stack>
      <Typography variant="caption" component="p" sx={{
        color: "text.secondary"
      }}>
        Last run: {lastRun}
      </Typography>
      {job.lastRunSummary && (
        <Typography variant="caption" component="p" sx={{
          color: "text.secondary"
        }}>
          {job.lastRunSummary}
        </Typography>
      )}
    </Box>
  );
}

interface HealthJobsCardProps {
  jobs: readonly HealthJob[];
  formatDateTime: (value: string | null | undefined) => string;
}

/**
 * The four schedulers `server.ts` starts. "Off" is a setting, not a fault — a payslip
 * schedule nobody has switched on has nothing to run.
 */
export function HealthJobsCard({ jobs, formatDateTime }: Readonly<HealthJobsCardProps>) {
  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Background jobs
      </Typography>
      {jobs.map((job) => (
        <JobRow key={job.key} job={job} formatDateTime={formatDateTime} />
      ))}
    </Box>
  );
}
