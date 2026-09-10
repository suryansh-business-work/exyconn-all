import { Alert, Box, Chip, Flex, Stack, Text } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useProjectHealthQuery } from '@exyconn/shell/graphql/generated';
import { HealthStat } from './HealthStat';
import {
  RISK_COLOR,
  RISK_LABEL,
  TIMELINE_COLOR,
  TIMELINE_LABEL,
  percentLabel,
} from './health-format';

/** Over its agreed hours is the one bar that should go red rather than simply fill up. */
function budgetColor(used: number | null | undefined): 'success' | 'warning' | 'error' {
  if (used === null || used === undefined) return 'success';
  if (used > 100) return 'error';
  if (used >= 90) return 'warning';
  return 'success';
}

/**
 * One project, measured against what it said it would do.
 *
 * Every figure is read from something the team already keeps — tickets, bugs, tracked
 * hours, the project's own dates and budget. Nothing here is typed twice, which is the only
 * reason a health page is still true a month after it was built.
 */
export function ProjectHealthPage({ projectId }: Readonly<{ projectId: string }>) {
  const { data, loading } = useProjectHealthQuery({
    variables: { id: projectId },
    skip: projectId === '',
    fetchPolicy: 'cache-and-network',
  });
  const { formatDate } = useSettings();
  const health = data?.projectHealth;

  if (!health) {
    return <Text color="text.secondary">{loading ? 'Loading…' : 'No health to report yet.'}</Text>;
  }

  const budgetUsed = health.budgetUsedPercent ?? null;
  const endLabel = health.endDate ? formatDate(health.endDate) : 'No end date set';

  return (
    <Stack spacing={2}>
      <Flex direction="row" alignItems="center" spacing={1}>
        <Chip
          label={RISK_LABEL[health.risk]}
          color={RISK_COLOR[health.risk]}
          sx={{ fontWeight: 600 }}
        />
        <Chip
          variant="outlined"
          label={TIMELINE_LABEL[health.timeline]}
          color={TIMELINE_COLOR[health.timeline]}
        />
        <Text size="caption" color="text.secondary">
          {endLabel}
        </Text>
      </Flex>

      {health.riskReasons.length > 0 ? (
        <Alert severity={health.risk === 'HIGH' ? 'error' : 'warning'}>
          <Stack spacing={0.25}>
            {health.riskReasons.map((reason) => (
              <Text key={reason}>{reason}</Text>
            ))}
          </Stack>
        </Alert>
      ) : null}

      <Box sx={[glass, { p: 2 }]}>
        <Flex direction="row" sx={{ flexWrap: 'wrap', gap: 3 }}>
          <HealthStat
            label="Progress"
            value={percentLabel(health.progressPercent, 'Not tracked')}
            percent={health.progressPercent}
            hint={
              health.progressPercent === null
                ? 'Mark a board column as done to track this'
                : undefined
            }
          />
          <HealthStat
            label="Hours"
            value={percentLabel(budgetUsed, 'No budget set')}
            percent={budgetUsed}
            color={budgetColor(budgetUsed)}
            hint={`${health.loggedHours} logged${health.budgetHours ? ` of ${health.budgetHours}` : ''}`}
          />
          <HealthStat label="Tickets" value={`${health.doneTaskCount}/${health.taskCount}`} />
          <HealthStat label="Open bugs" value={String(health.openBugCount)} />
          <HealthStat label="Team" value={String(health.teamSize)} />
        </Flex>
      </Box>
    </Stack>
  );
}
