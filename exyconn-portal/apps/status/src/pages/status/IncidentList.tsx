import { Box, Card, Chip, Divider, Flex, Typography } from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import { TIME_FORMAT } from '../../status.constants';
import type { StatusIncident } from './status.types';

interface IncidentListProps {
  incidents: StatusIncident[];
}

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
        <Typography variant="body2" color="text.secondary">
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
          <Flex
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1}
            sx={{ py: 1.75 }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                {incident.serviceName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatWith(incident.startedAt, TIME_FORMAT)} · {duration(incident.durationMinutes)}
                {incident.reason ? ` · ${incident.reason}` : ''}
              </Typography>
            </Box>
            <Chip
              size="small"
              color={incident.resolvedAt ? 'success' : 'error'}
              variant="outlined"
              label={incident.resolvedAt ? 'Resolved' : 'Ongoing'}
            />
          </Flex>
        </Box>
      ))}
    </Card>
  );
}
