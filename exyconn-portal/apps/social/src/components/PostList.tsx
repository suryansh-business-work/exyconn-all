import { Alert, Button, Skeleton, Stack, Typography } from '@exyconn/shell/components/ui';
import type { SocialPostFieldsFragment } from '@exyconn/shell/graphql/generated';
import { PostCard } from './PostCard';
import { useSocialActions } from '../hooks/useSocialActions';

interface PostListProps {
  posts: SocialPostFieldsFragment[];
  loading: boolean;
  error?: Error;
  /** Present when there is another page; absent when this is the end of the feed. */
  onLoadMore?: () => void;
  loadingMore?: boolean;
  emptyMessage: string;
}

/**
 * A column of posts, however they were fetched.
 *
 * It owns the like/share/delete wiring so the feed, a profile and a single post page all
 * behave identically — three screens that each re-implemented "delete this post" would be
 * three chances for one of them to forget to ask first.
 */
export function PostList({
  posts,
  loading,
  error,
  onLoadMore,
  loadingMore = false,
  emptyMessage,
}: Readonly<PostListProps>) {
  const { like, share, remove } = useSocialActions();

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  if (loading) {
    return (
      <Stack spacing={2}>
        {['a', 'b', 'c'].map((key) => (
          <Skeleton key={key} variant="rounded" height={180} />
        ))}
      </Stack>
    );
  }

  if (posts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onLike={like} onShare={share} onDelete={remove} />
      ))}
      {onLoadMore && (
        <Button onClick={onLoadMore} disabled={loadingMore} sx={{ alignSelf: 'center' }}>
          {loadingMore ? 'Loading…' : 'Load older posts'}
        </Button>
      )}
    </Stack>
  );
}
