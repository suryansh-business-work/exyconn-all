import { useT } from '@exyconn/i18n';
import { Card, Chip, LinearProgress, Stack, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { ClientHubProjectsQuery } from '@exyconn/shell/graphql/generated';

export type ClientProject = ClientHubProjectsQuery['clientHubProjects'][number];

/** Hours used as a share of the budget, capped at 100 for the bar. */
const usedPercent = (project: ClientProject): number | null =>
  project.budgetHours ? Math.min(100, (project.trackedHours / project.budgetHours) * 100) : null;

/** One project, as the client sees it: status, dates, hours against budget, milestones, work. */
export function ProjectCard({ project }: Readonly<{ project: ClientProject }>) {
  const t = useT();
  const { formatDate } = useSettings();
  const used = usedPercent(project);
  const dates = [project.startDate, project.endDate]
    .map((value) => (value ? formatDate(value) : '…'))
    .join(' – ');

  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: 'start' }}
        >
          <Text weight="semibold" size="lg">
            {project.name}
          </Text>
          <StatusChip value={project.status} />
        </Stack>
        <Text size="sm" color="text.secondary">
          {dates}
        </Text>
        <Stack spacing={0.5}>
          <Text size="sm">
            {project.budgetHours
              ? t('{used} of {budget} hours used', {
                  used: Math.round(project.trackedHours),
                  budget: project.budgetHours,
                })
              : t('{used} hours logged', { used: Math.round(project.trackedHours) })}
          </Text>
          {used !== null && (
            <LinearProgress
              variant="determinate"
              value={used}
              aria-label={t('Hours used against budget')}
            />
          )}
        </Stack>
        {project.ticketCounts.length > 0 && (
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
            {project.ticketCounts.map((column) => (
              <Chip key={column.status} size="small" label={`${column.status}: ${column.count}`} />
            ))}
          </Stack>
        )}
        {project.milestones.length > 0 && (
          <Stack spacing={0.5}>
            <Text size="sm" weight="semibold">
              {t('Milestones')}
            </Text>
            {project.milestones.map((milestone) => (
              <Stack
                key={`${milestone.name}-${milestone.dueOn ?? ''}`}
                direction="row"
                spacing={1}
                sx={{ justifyContent: 'space-between' }}
              >
                <Text size="sm">{milestone.name}</Text>
                <Text size="sm" color="text.secondary">
                  {milestone.dueOn ? formatDate(milestone.dueOn) : milestone.state}
                </Text>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
