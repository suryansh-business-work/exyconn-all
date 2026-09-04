import { Box, Chip, Flex, Text } from '@/components/ui';
import { formatDuration } from './tracker.format';
import type { TrackerDayData } from './tracker.types';

/** The house-wide project's name, shown when a session booked to nothing in particular. */
const UNATTRIBUTED = 'Unattributed';

interface ProjectTotal {
  name: string;
  activeMs: number;
}

/** Worked time per project, largest first. */
function totalsByProject(sessions: TrackerDayData['sessions']): ProjectTotal[] {
  const totals = new Map<string, number>();
  for (const session of sessions) {
    const name = session.projectName || UNATTRIBUTED;
    totals.set(name, (totals.get(name) ?? 0) + session.activeMs);
  }
  return [...totals]
    .map(([name, activeMs]) => ({ name, activeMs }))
    .sort((a, b) => b.activeMs - a.activeMs);
}

/**
 * What the day's work was booked against.
 *
 * The name is the one stored on the session when it opened, not a lookup: a project renamed
 * or archived last month must not rewrite what a timesheet from before then says it was for.
 */
export function TrackerDayProjects({
  sessions,
}: Readonly<{ sessions: TrackerDayData['sessions'] }>) {
  const totals = totalsByProject(sessions);

  if (totals.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        No sessions on this day.
      </Text>
    );
  }

  return (
    <Flex direction="column" spacing={0.75}>
      {totals.map((project) => (
        <Flex key={project.name} direction="row" alignItems="center" spacing={1}>
          <Chip label={project.name} size="small" />
          <Box sx={{ flexGrow: 1 }} />
          <Text size="sm" weight="bold">
            {formatDuration(project.activeMs)}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
