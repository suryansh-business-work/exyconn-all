import { Card, Chip, Flex, LinearProgress, Typography } from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import { DATE_FORMAT } from '../../status.constants';
import type { SharedMilestone, SharedTicketCount } from './shared-project.types';

interface SharedProjectProgressProps {
  milestones: readonly SharedMilestone[];
  ticketCounts: readonly SharedTicketCount[];
}

/** The colour a milestone's state reads as. HIT is good news; MISSED is not hidden. */
const MILESTONE_COLOR: Readonly<Record<string, 'default' | 'info' | 'success' | 'error'>> = {
  PLANNED: 'default',
  IN_PROGRESS: 'info',
  HIT: 'success',
  MISSED: 'error',
};

/** Milestones and where the work sits, as one card apiece. */
export function SharedProjectProgress({
  milestones,
  ticketCounts,
}: Readonly<SharedProjectProgressProps>) {
  const totalTickets = ticketCounts.reduce((total, entry) => total + entry.count, 0);

  return (
    <Flex direction="column" spacing={2}>
      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 1.5
          }}>
          Milestones
        </Typography>
        {milestones.length === 0 ? (
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            No milestones have been set for this project.
          </Typography>
        ) : (
          <Flex direction="column" spacing={1.25}>
            {milestones.map((milestone) => (
              <Flex key={milestone.name} alignItems="center" spacing={1.5}>
                <Chip
                  size="small"
                  color={MILESTONE_COLOR[milestone.state] ?? 'default'}
                  label={milestone.state.replaceAll('_', ' ')}
                />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {milestone.name}
                </Typography>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  {milestone.dueOn ? formatWith(milestone.dueOn, DATE_FORMAT) : 'No date'}
                </Typography>
              </Flex>
            ))}
          </Flex>
        )}
      </Card>

      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 1.5
          }}>
          Where the work is ({totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'})
        </Typography>
        {totalTickets === 0 ? (
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            No tickets have been raised on this project yet.
          </Typography>
        ) : (
          <Flex direction="column" spacing={1.5}>
            {ticketCounts.map((entry) => (
              <Flex key={entry.status} alignItems="center" spacing={2}>
                <Typography variant="body2" sx={{ minWidth: 140 }}>
                  {entry.status}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(entry.count / totalTickets) * 100}
                  aria-label={`${entry.status} share of tickets`}
                  sx={{ flex: 1, height: 8, borderRadius: 1 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    minWidth: 32
                  }}>
                  {entry.count}
                </Typography>
              </Flex>
            ))}
          </Flex>
        )}
      </Card>
    </Flex>
  );
}
