import {
  Alert,
  Box,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@exyconn/shell/components/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  SocialCommentsDocument,
  SocialPostDocument,
  useDeleteSocialCommentMutation,
  useSocialCommentsQuery,
} from '@exyconn/shell/graphql/generated';
import { AuthorLine } from '../../components/AuthorLine';

interface CommentThreadProps {
  postId: string;
}

/**
 * The conversation under a post, oldest first so it reads in the order it happened.
 *
 * Deleting a comment refetches the post as well as the thread — the count on the card
 * above has to fall at the same moment, or the page shows three comments and says four.
 */
export function CommentThread({ postId }: Readonly<CommentThreadProps>) {
  const notify = useNotify();
  const { data, loading, error } = useSocialCommentsQuery({ variables: { postId } });
  const [deleteComment] = useDeleteSocialCommentMutation({
    refetchQueries: [
      { query: SocialCommentsDocument, variables: { postId } },
      { query: SocialPostDocument, variables: { id: postId } },
    ],
  });

  const remove = async (id: string) => {
    try {
      await deleteComment({ variables: { id } });
    } catch (deleteError) {
      notify(errorMessage(deleteError, 'Could not delete that comment'), 'error');
    }
  };

  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (loading) return <Skeleton variant="rounded" height={120} />;

  const comments = data?.socialComments ?? [];
  if (comments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No comments yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {comments.map((comment) => (
        <Box key={comment.id}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <AuthorLine author={comment.author} at={comment.createdAt} dense />
            {comment.canDelete && (
              <Tooltip title="Delete comment">
                <IconButton
                  size="small"
                  aria-label="Delete comment"
                  onClick={() => remove(comment.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, ml: 6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
          >
            {comment.body}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
