import type { ReactElement } from 'react';
import { alpha, borderWidth, Box, Stack, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import type { TrackerMessage } from '@shared/types';
import { formatDateTime } from '../time';

interface Props {
  message: TrackerMessage;
  timezone: string;
}

/**
 * One line of the conversation.
 *
 * The employee's own messages sit on the right in the brand colour, the workspace's on the
 * left — the one arrangement every chat anybody has used already means "mine" and "theirs",
 * so the side does the work and nothing has to be labelled "You".
 */
export default function MessageBubble({ message, timezone }: Readonly<Props>): ReactElement {
  const mine = message.direction === 'TO_ADMIN';

  return (
    <Stack sx={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
      <Box
        sx={(theme) => ({
          maxWidth: '85%',
          px: 1.5,
          py: 1,
          borderRadius: `${TRACKER_RADIUS}px`,
          backgroundColor: mine
            ? alpha(theme.palette.primary.main, 0.16)
            : alpha(theme.palette.text.primary, 0.06),
          border: `${borderWidth.hairline}px solid ${alpha(theme.palette.text.primary, 0.1)}`,
        })}
      >
        {message.title !== '' ? (
          <Typography variant="subtitle2" sx={{ mb: 0.25 }}>
            {message.title}
          </Typography>
        ) : null}
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.body}
        </Typography>
      </Box>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          mt: 0.25,
        }}
      >
        {/* Who wrote it only when it was not the person reading it — "You, 10:42" is a line
            of noise on every message somebody sends. */}
        {mine ? '' : `${message.authorName || 'Your workspace'} · `}
        {formatDateTime(message.createdAt, timezone)}
      </Typography>
    </Stack>
  );
}
