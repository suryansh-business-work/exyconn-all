import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Stack,
  Typography,
} from '@exyconn/shell/components/ui';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { formatDuration } from '@exyconn/shell/pages/tracker-view/tracker.format';
import { useProjectTimeLogSessionsQuery } from '@exyconn/shell/graphql/generated';
import { TimeLogScreenshots } from './TimeLogScreenshots';

interface TimeLogSessionsProps {
  projectId: string;
  from: string;
  to: string;
  userId: string;
  /** '' is a real value: the runs booked to the project without a ticket. */
  taskId: string;
  canViewScreenshots: boolean;
}

/**
 * The individual runs behind one summary row, each expanding to its screenshots.
 *
 * The images are fetched only when a run is opened — a fortnight of a busy project is
 * hundreds of screenshots, and loading them all to render a list nobody has drilled into
 * would cost the viewer megabytes to look at a table of times.
 */
export function TimeLogSessions({
  projectId,
  from,
  to,
  userId,
  taskId,
  canViewScreenshots,
}: Readonly<TimeLogSessionsProps>) {
  const { formatDateTime } = useSettings();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, loading } = useProjectTimeLogSessionsQuery({
    variables: { projectId, from, to, userId, taskId },
  });

  const sessions = data?.projectTimeLogSessions ?? [];

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading runs…
      </Typography>
    );
  }
  if (sessions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        This time was claimed off-computer — there are no tracked runs behind it.
      </Typography>
    );
  }

  return (
    <Stack>
      {sessions.map((session) => (
        <Accordion
          key={session.id}
          expanded={openId === session.id}
          onChange={(_event, open) => setOpenId(open ? session.id : null)}
          disableGutters
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ flexWrap: 'wrap', width: '100%' }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatDateTime(session.startedAt)}
              </Typography>
              <Chip size="small" label={formatDuration(session.activeMs)} />
              {session.idleMs > 0 ? (
                <Typography variant="caption" color="text.secondary">
                  {formatDuration(session.idleMs)} idle
                </Typography>
              ) : null}
              {session.endedAt === null ? (
                <Chip size="small" color="success" label="Running" />
              ) : null}
              {session.screenshotCount > 0 ? (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PhotoCameraIcon sx={{ fontSize: 14 }} color="disabled" />
                  <Typography variant="caption" color="text.secondary">
                    {session.screenshotCount}
                  </Typography>
                </Stack>
              ) : null}
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {openId === session.id ? (
              <TimeLogScreenshots
                projectId={projectId}
                sessionId={session.id}
                allowed={canViewScreenshots}
              />
            ) : null}
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}
