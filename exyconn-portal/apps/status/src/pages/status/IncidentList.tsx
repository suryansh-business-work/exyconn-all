import { Box, Card, Chip, Divider, Flex, Typography } from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import { IncidentImpact } from '@exyconn/shell/graphql/generated';
import { TIME_FORMAT } from '../../status.constants';
import { IncidentUpdates } from './IncidentUpdates';
import type { StatusIncident } from './status.types';

interface IncidentListProps {
  incidents: StatusIncident[];
}

type ImpactTone = 'error' | 'warning' | 'info';

/** How loudly each impact level is coloured. */
const IMPACT_TONES: Record<IncidentImpact, ImpactTone> = {
  [IncidentImpact.Critical]: 'error',
  [IncidentImpact.Major]: 'warning',
  [IncidentImpact.Minor]: 'info',
};

/** Minutes rendered the way people say them out loud. */
function duration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/** What went wrong recently, newest first — empty is the good case, so say so. */
export function IncidentList({ incidents }: Readonly<IncidentListProps>) {
  if (incidents.length === 0) {
    return (
      <Card variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          No incidents recorded. Every service has answered every check.
        </Typography>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ px: { xs: 2, md: 3 }, py: 0.5 }}>
      {incidents.map((incident, index) => (
        <Box key={incident.id}>
          {index > 0 && <Divider />}
          <Box sx={{ py: 1.75 }}>
            <Flex
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
            >
              <Box>
                <Typography variant="subtitle2" sx={{
                  fontWeight: 700
                }}>
                  {incident.title}
                </Typography>
                <Typography variant="body2" sx={{
                  color: "text.secondary"
                }}>
                  {incident.serviceName} · {formatWith(incident.startedAt, TIME_FORMAT)} ·{' '}
                  {duration(incident.durationMinutes)}
                </Typography>
              </Box>
              <Flex alignItems="center" spacing={1}>
                <Chip
                  size="small"
                  color={IMPACT_TONES[incident.impact]}
                  variant="outlined"
                  label={`${incident.impact.toLowerCase()} impact`}
                />
                <Chip
                  size="small"
                  color={incident.resolvedAt ? 'success' : 'error'}
                  variant="outlined"
                  label={incident.resolvedAt ? 'Resolved' : 'Ongoing'}
                />
              </Flex>
            </Flex>
            <IncidentUpdates updates={incident.updates} />
          </Box>
        </Box>
      ))}
    </Card>
  );
}
