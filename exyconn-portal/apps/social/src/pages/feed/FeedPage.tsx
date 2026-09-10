import { Box, Stack } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useSocialFeedQuery, type SocialFeedQuery } from '@exyconn/shell/graphql/generated';
import { PostList } from '../../components/PostList';
import { PostForm } from './forms/post';

/** As wide as a column of prose stays readable; the feed is centred inside it. */
const FEED_WIDTH = 720;

/**
 * The company feed: everybody's posts, newest first, with the composer on top.
 *
 * Paged rather than infinite — `fetchMore` appends the next page onto the cached result,
 * so "load older posts" never re-fetches what is already on screen.
 */
export function FeedPage() {
  const { data, loading, error, fetchMore, networkStatus } = useSocialFeedQuery({
    notifyOnNetworkStatusChange: true,
  });

  const feed = data?.socialFeed;
  const cursor = feed?.nextCursor;

  /**
   * Appends the next page onto the one already on screen.
   *
   * Done here rather than through a cache type policy because the merge is only correct
   * for this one field: everything else that returns a page in this app is a fresh list,
   * and a global "always append" policy would make those grow instead of replace.
   */
  const loadMore = () =>
    fetchMore({
      variables: { cursor },
      updateQuery: (previous, { fetchMoreResult }): SocialFeedQuery => ({
        socialFeed: {
          ...fetchMoreResult.socialFeed,
          posts: [...previous.socialFeed.posts, ...fetchMoreResult.socialFeed.posts],
        },
      }),
    });

  return (
    <Box sx={{ maxWidth: FEED_WIDTH, mx: 'auto' }}>
      <PageHeader title="Social" subtitle="What the company is up to" />
      <Stack spacing={2}>
        <PostForm />
        <PostList
          posts={feed?.posts ?? []}
          loading={loading && !feed}
          error={error}
          loadingMore={networkStatus === 3}
          onLoadMore={cursor ? loadMore : undefined}
          emptyMessage="Nothing here yet. Be the first to post something."
        />
      </Stack>
    </Box>
  );
}
