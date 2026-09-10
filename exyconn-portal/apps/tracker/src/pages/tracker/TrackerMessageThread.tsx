import { useEffect, useState } from 'react';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  TrackerMessageThreadDocument,
  TrackerMessageThreadsDocument,
  useMarkTrackerThreadReadMutation,
  useSendTrackerMessageMutation,
  useTrackerMessageThreadQuery,
  type TrackerMessageFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** The portal refuses anything longer, so the field stops before the round trip does. */
const MAX_CHARS = 2000;

interface BubbleProps {
  message: TrackerMessageFieldsFragment;
  formatDateTime: (value: string) => string;
}

/** One line of the conversation: the employee's on the left, the desk's own on the right. */
function Bubble({ message, formatDateTime }: Readonly<BubbleProps>) {
  const fromDesk = message.direction === 'TO_EMPLOYEE';

  return (
    <Stack sx={{ alignItems: fromDesk ? 'flex-end' : 'flex-start' }}>
      <Box
        sx={(theme) => ({
          maxWidth: '80%',
          px: 1.5,
          py: 1,
          borderRadius: 1,
          backgroundColor: fromDesk
            ? alpha(theme.palette.primary.main, 0.14)
            : alpha(theme.palette.text.primary, 0.06),
        })}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.body}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{
        color: "text.secondary"
      }}>
        {fromDesk ? `${message.authorName || 'Tracker desk'} · ` : ''}
        {formatDateTime(message.createdAt)}
      </Typography>
    </Stack>
  );
}

interface TrackerMessageThreadProps {
  userId: string;
  userName: string;
}

/**
 * One employee's conversation, and the box to answer it in.
 *
 * Opening it marks their messages read, which is what clears the inbox badge — reading a
 * message is the act of reading it, not a separate button somebody has to remember.
 */
export function TrackerMessageThread({ userId, userName }: Readonly<TrackerMessageThreadProps>) {
  const { formatDateTime } = useSettings();
  const notify = useNotify();
  const [body, setBody] = useState('');
  const { data, loading } = useTrackerMessageThreadQuery({
    variables: { userId },
    fetchPolicy: 'cache-and-network',
    pollInterval: 15_000,
  });
  const [markRead] = useMarkTrackerThreadReadMutation({
    refetchQueries: [TrackerMessageThreadsDocument],
  });
  const [send, { loading: sending }] = useSendTrackerMessageMutation({
    refetchQueries: [
      { query: TrackerMessageThreadDocument, variables: { userId } },
      TrackerMessageThreadsDocument,
    ],
  });

  useEffect(() => {
    markRead({ variables: { userId } }).catch(() => {
      // A badge that failed to clear is not worth interrupting a reply for.
    });
  }, [userId, markRead]);

  const messages = data?.trackerMessageThread ?? [];

  const submit = async () => {
    const trimmed = body.trim();
    if (trimmed === '' || sending) return;
    try {
      await send({ variables: { userId, body: trimmed } });
      // Cleared only once the portal has taken it — clearing on the press would lose what
      // was typed the first time a connection dropped.
      setBody('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not send the message', 'error');
    }
  };

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Typography variant="subtitle1">{userName}</Typography>

      <Stack spacing={1.5} sx={{ flex: 1, minHeight: 240, overflowY: 'auto' }}>
        {loading && messages.length === 0 ? (
          <Skeleton variant="rounded" height={64} />
        ) : (
          messages.map((message) => (
            <Bubble key={message.id} message={message} formatDateTime={formatDateTime} />
          ))
        )}
        {!loading && messages.length === 0 ? (
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Nothing has been said yet. Anything you write appears on their tracker.
          </Typography>
        ) : null}
      </Stack>

      <Stack direction="row" spacing={1} sx={{
        alignItems: "flex-end"
      }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder={`Reply to ${userName}…`}
          value={body}
          disabled={sending}
          inputProps={{ maxLength: MAX_CHARS, 'aria-label': 'Reply' }}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <IconButton
          color="primary"
          aria-label="Send reply"
          disabled={body.trim() === '' || sending}
          onClick={() => void submit()}
        >
          <SendIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
}
