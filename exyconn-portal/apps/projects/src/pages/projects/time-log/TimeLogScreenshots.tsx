import { Alert, Box, Grid2, Stack, Typography } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useProjectTimeLogScreenshotsQuery } from '@exyconn/shell/graphql/generated';

interface TimeLogScreenshotsProps {
  projectId: string;
  sessionId: string;
  /** False when the viewer holds a board role but not the tracker one. */
  allowed: boolean;
}

/**
 * The screenshots captured during one session.
 *
 * When the viewer may not see them, this says so instead of rendering an empty gallery —
 * "there are none" and "you may not look" are different facts, and a project manager
 * deserves the second one rather than being left to conclude the first.
 */
export function TimeLogScreenshots({
  projectId,
  sessionId,
  allowed,
}: Readonly<TimeLogScreenshotsProps>) {
  const { formatDateTime } = useSettings();
  const { data } = useProjectTimeLogScreenshotsQuery({
    variables: { projectId, sessionId },
    skip: !allowed,
  });

  if (!allowed) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        Screenshots are part of the tracker, not the project board. Ask someone with the Tracker
        role to review them.
      </Alert>
    );
  }

  const shots = data?.projectTimeLogScreenshots ?? [];
  if (shots.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        No screenshots were captured during this session.
      </Typography>
    );
  }

  return (
    <Grid2 container spacing={1} sx={{ mt: 1 }}>
      {shots.map((shot) => (
        <Grid2 key={shot.id} size={{ xs: 6, sm: 4, md: 3 }}>
          <Stack spacing={0.5}>
            <Box
              component="a"
              href={shot.imageUrl}
              target="_blank"
              rel="noreferrer"
              sx={{
                display: 'block',
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                component="img"
                src={shot.imageUrl}
                alt={`Screen at ${formatDateTime(shot.capturedAt)}`}
                loading="lazy"
                sx={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDateTime(shot.capturedAt)}
              {shot.blurred ? ' · blurred' : ''}
            </Typography>
          </Stack>
        </Grid2>
      ))}
    </Grid2>
  );
}
