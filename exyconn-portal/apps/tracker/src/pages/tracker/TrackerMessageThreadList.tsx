import {
  Badge,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { TrackerMessageThreadsQuery } from '@exyconn/shell/graphql/generated';

type Thread = TrackerMessageThreadsQuery['trackerMessageThreads'][number];

interface TrackerMessageThreadListProps {
  threads: readonly Thread[];
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
}

/**
 * Who has written in, newest conversation first, with the unread count that says where to
 * look. Nobody has to remember which employee they were mid-reply to.
 */
export function TrackerMessageThreadList({
  threads,
  selectedUserId,
  onSelect,
}: Readonly<TrackerMessageThreadListProps>) {
  const { formatDateTime } = useSettings();

  if (threads.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="subtitle1">No conversations yet</Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mt: 0.5
          }}>
          A thread appears here as soon as an employee writes from their tracker.
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {threads.map((thread) => (
        <ListItemButton
          key={thread.userId}
          selected={thread.userId === selectedUserId}
          onClick={() => onSelect(thread.userId)}
          alignItems="flex-start"
        >
          <ListItemText
            primary={
              <Badge badgeContent={thread.unread} color="error" sx={{ pr: thread.unread ? 2 : 0 }}>
                <Typography variant="subtitle2">{thread.userName}</Typography>
              </Badge>
            }
            secondary={
              <>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    color: "text.secondary",
                    display: "block"
                  }}>
                  {thread.lastMessageBody}
                </Typography>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  {thread.lastMessageAt ? formatDateTime(thread.lastMessageAt) : ''}
                </Typography>
              </>
            }
            slotProps={{
              secondary: { component: 'div' }
            }}
          />
        </ListItemButton>
      ))}
    </List>
  );
}
