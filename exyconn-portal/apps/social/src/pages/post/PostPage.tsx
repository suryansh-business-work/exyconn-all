import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@exyconn/shell/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSocialPostQuery } from '@exyconn/shell/graphql/generated';
import { PostCard } from '../../components/PostCard';
import { useSocialActions } from '../../hooks/useSocialActions';
import { CommentThread } from './CommentThread';
import { CommentForm } from './forms/comment';

const PAGE_WIDTH = 720;

/**
 * One post and its conversation.
 *
 * Deleting the post from here has nowhere to stay, so it returns to the feed — hence
 * this page holding the actions rather than reusing the list's copy of them.
 */
export function PostPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { like, share, remove } = useSocialActions();
  const { data, loading, error } = useSocialPostQuery({ variables: { id } });

  const onDelete = async (postId: string) => {
    if (await remove(postId)) navigate('/social');
  };

  const post = data?.socialPost;

  return (
    <Box sx={{ maxWidth: PAGE_WIDTH, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/social')} sx={{ mb: 2 }}>
        Back to the feed
      </Button>

      {error && <Alert severity="error">{error.message}</Alert>}
      {loading && <Skeleton variant="rounded" height={220} />}

      {post && (
        <Stack spacing={2}>
          <PostCard post={post} onLike={like} onShare={share} onDelete={onDelete} />
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Comments
              </Typography>
              <Stack spacing={3}>
                <CommentThread postId={post.id} />
                <CommentForm postId={post.id} />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
