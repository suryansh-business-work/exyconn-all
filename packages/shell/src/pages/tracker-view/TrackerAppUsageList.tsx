import { Box, Flex, Text } from '@/components/ui';
import { formatDuration } from './tracker.format';
import type { TrackerAppUsageData } from './tracker.types';

interface TrackerAppUsageListProps {
  apps: readonly TrackerAppUsageData[];
}

/** Presentational top-5 apps-by-duration list for the selected day. */
export function TrackerAppUsageList({ apps }: Readonly<TrackerAppUsageListProps>) {
  if (apps.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        No app usage recorded.
      </Text>
    );
  }

  const top = [...apps].sort((a, b) => b.durationMs - a.durationMs).slice(0, 5);

  return (
    <Box>
      {top.map((app) => (
        <Flex key={app.appName} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
          <Text size="sm" noWrap sx={{ mr: 1 }}>
            {app.appName}
          </Text>
          <Text size="sm" color="text.secondary">
            {formatDuration(app.durationMs)}
          </Text>
        </Flex>
      ))}
    </Box>
  );
}
