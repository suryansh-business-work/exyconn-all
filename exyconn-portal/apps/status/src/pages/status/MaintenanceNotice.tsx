import EngineeringIcon from '@mui/icons-material/Engineering';
import { Alert, Box, Chip, Flex, Typography } from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import { TIME_FORMAT } from '../../status.constants';
import type { StatusMaintenance, StatusService } from './status.types';

interface MaintenanceNoticeProps {
  maintenance: StatusMaintenance[];
  services: StatusService[];
}

/** The service names behind a window's keys, in catalogue order. */
function affectedNames(window: StatusMaintenance, services: StatusService[]): string {
  const keys = new Set(window.affectedServiceKeys);
  return services
    .filter((service) => keys.has(service.key))
    .map((service) => service.name)
    .join(', ');
}

/** Planned downtime, announced before it happens and flagged while it is under way. */
export function MaintenanceNotice({ maintenance, services }: Readonly<MaintenanceNoticeProps>) {
  if (maintenance.length === 0) {
    return null;
  }

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 2,
        }}
      >
        Scheduled maintenance
      </Typography>
      <Flex direction="column" spacing={1.5}>
        {maintenance.map((window) => (
          <Alert
            key={window.id}
            severity={window.inProgress ? 'warning' : 'info'}
            icon={<EngineeringIcon fontSize="inherit" />}
          >
            <Flex alignItems="center" spacing={1} flexWrap="wrap">
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                }}
              >
                {window.title}
              </Typography>
              <Chip
                size="small"
                color={window.inProgress ? 'warning' : 'info'}
                variant="outlined"
                label={window.inProgress ? 'In progress' : 'Upcoming'}
              />
            </Flex>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {formatWith(window.startsAt, TIME_FORMAT)} → {formatWith(window.endsAt, TIME_FORMAT)}
              {' · '}
              {affectedNames(window, services) || 'All services'}
            </Typography>
            {window.body && (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mt: 0.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {window.body}
              </Typography>
            )}
          </Alert>
        ))}
      </Flex>
    </Box>
  );
}
