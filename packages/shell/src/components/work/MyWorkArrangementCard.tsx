import { Paper, Skeleton, Text } from '@/components/ui';
import { glass } from '@/components/glass/glass';
import { useMyWorkProfileQuery } from '@/graphql/generated';
import { WorkArrangementFacts } from './WorkArrangementFacts';
import { workHours } from './work-arrangement';

/**
 * The signed-in employee's own working arrangement.
 *
 * Shown next to their attendance and their tracker, because those are the two places the
 * arrangement actually bites: the hours here are the target the desktop tracker fills its
 * progress bar against, and the day it measures only starts once attendance is marked.
 * HR owns the values — this is a read-only statement of what was agreed.
 */
export function MyWorkArrangementCard() {
  const { data, loading } = useMyWorkProfileQuery();
  const arrangement = data?.me;

  return (
    <Paper sx={[glass, { p: 3, mb: 2.5 }]}>
      <Text size="overline" color="text.secondary">
        My working arrangement
      </Text>
      {loading && !arrangement && <Skeleton height={64} />}
      {arrangement && (
        <>
          <WorkArrangementFacts arrangement={arrangement} />
          <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Your day is {workHours(arrangement)} hours. HR sets this; the desktop tracker shows how
            much of it you have worked. Ask HR if it does not match your contract.
          </Text>
        </>
      )}
    </Paper>
  );
}
