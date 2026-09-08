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
import { AttachmentList, AttachmentPicker, type PickedAttachment } from '../attachments';
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
  // One file per comment: a comment carrying a document is the case people ask for, and a
  // multi-file tray here would compete with the ticket's own attachment list.
  const [file, setFile] = useState<PickedAttachment | null>(null);

  const comments = data?.taskComments ?? [];

  const fail = (error: unknown) =>
    notify(error instanceof Error ? error.message : 'Action failed', 'error');

  const submit = async () => {
    if (body.trim() === '') return;
    try {
      await addComment({
        variables: { taskId, body: body.trim(), attachments: file ? [file] : [] },
      });
      setBody('');
      setFile(null);
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
              {comment.attachments.length > 0 ? (
                <Box sx={{ mt: 1 }}>
                  <AttachmentList files={comment.attachments} />
                </Box>
              ) : null}
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
      {file ? (
        <Box sx={{ mt: 1 }}>
          <AttachmentList files={[file]} />
        </Box>
      ) : null}

      <Flex direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="contained"
          disabled={adding || body.trim() === ''}
          onClick={submit}
        >
          Comment
        </Button>
        <AttachmentPicker label="Attach" showHelp={false} onPicked={setFile} />
      </Flex>
    </Box>
  );
}
