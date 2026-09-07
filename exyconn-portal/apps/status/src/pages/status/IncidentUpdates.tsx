import { Box, Chip, Flex, Typography } from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import { IncidentUpdateStatus } from '@exyconn/shell/graphql/generated';
import { TIME_FORMAT } from '../../status.constants';
import type { StatusIncidentUpdate } from './status.types';

type UpdateTone = 'error' | 'warning' | 'info' | 'success';

/** The colour each step of the timeline paints itself. */
const UPDATE_TONES: Record<IncidentUpdateStatus, UpdateTone> = {
  [IncidentUpdateStatus.Investigating]: 'error',
  [IncidentUpdateStatus.Identified]: 'warning',
  [IncidentUpdateStatus.Monitoring]: 'info',
  [IncidentUpdateStatus.Resolved]: 'success',
};

interface IncidentUpdatesProps {
  updates: StatusIncidentUpdate[];
}

/** An incident's timeline as the API hands it over: newest first. */
export function IncidentUpdates({ updates }: Readonly<IncidentUpdatesProps>) {
  if (updates.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 1.5, pl: 1.5, borderLeft: 2, borderColor: 'divider' }}>
      {updates.map((update) => (
        <Box key={update.id} sx={{ mb: 1.25 }}>
          <Flex alignItems="center" spacing={1} flexWrap="wrap">
            <Chip
              size="small"
              color={UPDATE_TONES[update.status]}
              variant="outlined"
              label={update.status.toLowerCase()}
            />
            <Typography variant="caption" color="text.secondary">
              {formatWith(update.createdAt, TIME_FORMAT)}
            </Typography>
          </Flex>
          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
            {update.body}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
