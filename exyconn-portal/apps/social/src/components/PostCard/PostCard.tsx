import { Card, CardContent, IconButton, Stack, Tooltip } from '@exyconn/shell/components/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { SocialPostFieldsFragment } from '@exyconn/shell/graphql/generated';
import { AuthorLine } from '../AuthorLine';
import { PostActions } from './PostActions';
import { PostBody } from './PostBody';
import { SharedPost } from './SharedPost';

interface PostCardProps {
  post: SocialPostFieldsFragment;
  onLike: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * One post on the feed: who wrote it, what they said, what they shared, and what you
 * can do about it.
 *
 * The card knows nothing about how any of that is carried out — every action is a
 * callback — so the same card serves the feed, a profile and a post's own page.
 */
export function PostCard({ post, onLike, onShare, onDelete }: Readonly<PostCardProps>) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-start"
          }}>
          <AuthorLine author={post.author} at={post.createdAt} />
          {post.canDelete && (
            <Tooltip title="Delete post">
              <IconButton size="small" aria-label="Delete post" onClick={() => onDelete(post.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <PostBody body={post.body} imageUrl={post.imageUrl} />
        {post.sharedFrom && <SharedPost original={post.sharedFrom} />}

        <PostActions
          postId={post.id}
          likeCount={post.likeCount}
          commentCount={post.commentCount}
          shareCount={post.shareCount}
          likedByMe={post.likedByMe}
          onLike={() => onLike(post.id)}
          onShare={() => onShare(post.id)}
        />
      </CardContent>
    </Card>
  );
}
