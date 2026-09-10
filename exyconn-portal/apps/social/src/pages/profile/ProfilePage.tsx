import { useParams } from 'react-router-dom';
import { Alert, Box, Skeleton, Stack, Typography } from '@exyconn/shell/components/ui';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import {
  useSocialProfileQuery,
  useSocialUserPostsQuery,
  type SocialUserPostsQuery,
} from '@exyconn/shell/graphql/generated';
import { PostList } from '../../components/PostList';
import { ProfileHeader } from './ProfileHeader';

const PAGE_WIDTH = 720;

/**
 * A colleague's profile, or your own.
 *
 * `/social/me` and `/social/people/:userId` are the same page: the sidebar wants a link
 * that works without knowing who is signed in, and everything below the name is
 * identical either way.
 */
export function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const id = userId ?? user?.id ?? '';

  const profile = useSocialProfileQuery({ variables: { userId: id }, skip: !id });
  const posts = useSocialUserPostsQuery({
    variables: { userId: id },
    skip: !id,
    notifyOnNetworkStatusChange: true,
  });

  const page = posts.data?.socialUserPosts;
  const cursor = page?.nextCursor;

  const loadMore = () =>
    posts.fetchMore({
      variables: { cursor },
      updateQuery: (previous, { fetchMoreResult }): SocialUserPostsQuery => ({
        socialUserPosts: {
          ...fetchMoreResult.socialUserPosts,
          posts: [...previous.socialUserPosts.posts, ...fetchMoreResult.socialUserPosts.posts],
        },
      }),
    });

  if (profile.error) return <Alert severity="error">{profile.error.message}</Alert>;

  const isMe = id === user?.id;

  return (
    <Box sx={{ maxWidth: PAGE_WIDTH, mx: 'auto' }}>
      <Stack spacing={2}>
        {profile.loading && <Skeleton variant="rounded" height={200} />}
        {profile.data && <ProfileHeader profile={profile.data.socialProfile} />}

        <Typography variant="subtitle2" sx={{ pt: 1 }}>
          Posts
        </Typography>
        <PostList
          posts={page?.posts ?? []}
          loading={posts.loading && !page}
          error={posts.error}
          loadingMore={posts.networkStatus === 3}
          onLoadMore={cursor ? loadMore : undefined}
          emptyMessage={isMe ? 'You have not posted anything yet.' : 'Nothing posted yet.'}
        />
      </Stack>
    </Box>
  );
}
