import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Flex,
  IconButton,
  Text,
  TextField,
} from '@exyconn/shell/components/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useTaskCommentsQuery,
  useAddTaskCommentMutation,
  useDeleteTaskCommentMutation,
} from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { initialsOf } from './ticket-meta';

interface TicketCommentsProps {
  taskId: string;
}

/** The conversation on a ticket: who said what, when, oldest first. */
export function TicketComments({ taskId }: Readonly<TicketCommentsProps>) {
  const notify = useNotify();
  const { formatDateTime } = useSettings();
  const { data, refetch } = useTaskCommentsQuery({ variables: { taskId } });
  const [addComment, { loading: adding }] = useAddTaskCommentMutation();
  const [deleteComment] = useDeleteTaskCommentMutation();
  const [body, setBody] = useState('');

  const comments = data?.taskComments ?? [];

  const fail = (error: unknown) =>
    notify(error instanceof Error ? error.message : 'Action failed', 'error');

  const submit = async () => {
    if (body.trim() === '') return;
    try {
      await addComment({ variables: { taskId, body: body.trim() } });
      setBody('');
      await refetch();
    } catch (error) {
      fail(error);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteComment({ variables: { id } });
      await refetch();
    } catch (error) {
      fail(error);
    }
  };

  return (
    <Box>
      <Text size="label" sx={{ mb: 1 }}>
        Comments ({comments.length})
      </Text>
      <Divider sx={{ mb: 1.5 }} />

      <Flex direction="column" spacing={1.5}>
        {comments.map((comment) => (
          <Flex key={comment.id} direction="row" spacing={1.25} alignItems="flex-start">
            <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
              {initialsOf(comment.authorName)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Flex direction="row" spacing={1} alignItems="baseline">
                <Text size="sm" weight="medium">
                  {comment.authorName}
                </Text>
                <Text size="caption" color="text.secondary">
                  {formatDateTime(comment.createdAt)}
                </Text>
              </Flex>
              <Text size="sm" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {comment.body}
              </Text>
            </Box>
            <IconButton
              size="small"
              aria-label={`Delete comment by ${comment.authorName}`}
              onClick={() => remove(comment.id)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Flex>
        ))}

        {comments.length === 0 ? (
          <Text size="sm" color="text.secondary">
            No comments yet.
          </Text>
        ) : null}
      </Flex>

      <TextField
        fullWidth
        multiline
        minRows={2}
        size="small"
        placeholder="Add a comment…"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        sx={{ mt: 2 }}
      />
      <Button
        size="small"
        variant="contained"
        sx={{ mt: 1 }}
        disabled={adding || body.trim() === ''}
        onClick={submit}
      >
        Comment
      </Button>
    </Box>
  );
}
