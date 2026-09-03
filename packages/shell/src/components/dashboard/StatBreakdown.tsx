import { Box, Stack, Typography } from '@/components/ui';
import { glass } from '../glass/glass';

export interface BreakdownBucket {
  value: string;
  count: number;
}

interface StatBreakdownProps {
  title: string;
  buckets: BreakdownBucket[];
  /** Bar colour. Defaults to the dashboard accent. */
  accent?: string;
  emptyMessage?: string;
}

/** SCREAMING_SNAKE enum values read badly in a UI; show them as words. */
function humanise(value: string): string {
  const spaced = value.replaceAll('_', ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * How a module's rows are distributed across one field — the thing a register of
 * rows cannot show at a glance. Bars are scaled to the largest bucket rather than
 * the total, so a long tail stays readable next to a dominant one.
 */
export function StatBreakdown({
  title,
  buckets,
  accent = '#4f8cff',
  emptyMessage = 'Nothing to show yet.',
}: Readonly<StatBreakdownProps>) {
  const ordered = [...buckets].sort((a, b) => b.count - a.count);
  const largest = ordered[0]?.count ?? 0;

  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {ordered.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          {emptyMessage}
        </Typography>
      )}
      <Stack spacing={1.25}>
        {ordered.map((bucket) => (
          <Box key={bucket.value}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
              <Typography variant="caption" color="text.secondary">
                {humanise(bucket.value)}
              </Typography>
              <Typography variant="caption" fontWeight={700}>
                {bucket.count}
              </Typography>
            </Stack>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: accent,
                  width: largest ? `${Math.max((bucket.count / largest) * 100, 2)}%` : '0%',
                }}
              />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
