import { Box } from '@/components/ui';
import { DetailFact, DetailFactGrid } from '@/components/data/DetailFact';
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
      <DetailFactGrid>
        <DetailFact label="Working time">
          {describeArrangement(arrangement.workingTime, arrangement.workingTimeNote)}
        </DetailFact>
        <DetailFact label="Work location">
          {describeArrangement(arrangement.workLocation, arrangement.workLocationNote)}
        </DetailFact>
        <DetailFact label="Hours per day">{workHours(arrangement)} h</DetailFact>
      </DetailFactGrid>

      {showProfile && arrangement.address && (
        <Box sx={{ mt: 2 }}>
          <DetailFact label="Address">{arrangement.address}</DetailFact>
        </Box>
      )}

      {showProfile && arrangement.brief && (
        <Box sx={{ mt: 2 }}>
          <DetailFact label="Brief">{arrangement.brief}</DetailFact>
        </Box>
      )}
    </>
  );
}
