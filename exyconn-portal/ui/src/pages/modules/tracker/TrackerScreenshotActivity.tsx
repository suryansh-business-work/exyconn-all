import { Flex, LinearProgress, Text } from '@/components/ui';

interface TrackerScreenshotActivityProps {
  /** Activity level (0-100) of the interval the screenshot was captured in. */
  percent: number;
}

/**
 * The activity level of the interval one screenshot belongs to — a bar plus the number, so the
 * level of a shot reads at a glance without parsing the figure.
 */
export function TrackerScreenshotActivity({ percent }: Readonly<TrackerScreenshotActivityProps>) {
  return (
    <Flex direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5, width: '100%' }}>
      <LinearProgress
        variant="determinate"
        value={percent}
        aria-label={`Activity ${percent}%`}
        sx={{ flex: 1, height: 4, borderRadius: '4px' }}
      />
      <Text size="caption" color="text.secondary" sx={{ minWidth: 28, textAlign: 'right' }}>
        {`${percent}%`}
      </Text>
    </Flex>
  );
}
