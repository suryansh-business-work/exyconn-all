import { Box, Flex, Text } from '@/components/ui';
import { describeArrangement, workHours, type WorkArrangement } from './work-arrangement';

interface WorkArrangementFactsProps {
  arrangement: WorkArrangement;
  /** Address and brief describe the person, not the arrangement — off by default. */
  showProfile?: boolean;
}

/**
 * When, from where, and for how long a day somebody works.
 *
 * The same three facts the desktop tracker reads, rendered identically wherever they appear —
 * HR's employee record, and each employee's own workspace — so nobody has to reconcile two
 * descriptions of one contract.
 */
export function WorkArrangementFacts({
  arrangement,
  showProfile = false,
}: Readonly<WorkArrangementFactsProps>) {
  return (
    <>
      <Flex direction={{ xs: 'column', sm: 'row' }} spacing={3}>
        <Box>
          <Text size="overline" color="text.secondary">
            Working time
          </Text>
          <Text size="sm">
            {describeArrangement(arrangement.workingTime, arrangement.workingTimeNote)}
          </Text>
        </Box>
        <Box>
          <Text size="overline" color="text.secondary">
            Work location
          </Text>
          <Text size="sm">
            {describeArrangement(arrangement.workLocation, arrangement.workLocationNote)}
          </Text>
        </Box>
        <Box>
          <Text size="overline" color="text.secondary">
            Hours per day
          </Text>
          <Text size="sm">{workHours(arrangement)} h</Text>
        </Box>
      </Flex>

      {showProfile && arrangement.address && (
        <Box sx={{ mt: 2 }}>
          <Text size="overline" color="text.secondary">
            Address
          </Text>
          <Text size="sm">{arrangement.address}</Text>
        </Box>
      )}

      {showProfile && arrangement.brief && (
        <Box sx={{ mt: 2 }}>
          <Text size="overline" color="text.secondary">
            Brief
          </Text>
          <Text size="sm">{arrangement.brief}</Text>
        </Box>
      )}
    </>
  );
}
