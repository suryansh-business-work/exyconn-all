import { Link as RouterLink } from 'react-router-dom';
import { useT, type Interpolations } from '@exyconn/i18n';
import { Button, Stack } from '@exyconn/shell/components/ui';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ShareIcon from '@mui/icons-material/Share';

interface PostActionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  onLike: () => void;
  onShare: () => void;
}

/** The translator, as this module's helper receives it. */
type Translate = (source: string, values?: Interpolations) => string;

/** A count is only worth printing once there is one. */
function label(text: string, count: number, t: Translate): string {
  if (count === 0) {
    return t(text);
  }
  return t('{action} · {count}', { action: t(text), count });
}

/**
 * The three things you can do with somebody else's post.
 *
 * Comment is a link rather than a button because commenting happens on the post's own
 * page — the feed stays a feed, and a half-typed comment is not lost to a scroll.
 */
export function PostActions({
  postId,
  likeCount,
  commentCount,
  shareCount,
  likedByMe,
  onLike,
  onShare,
}: Readonly<PostActionsProps>) {
  const t = useT();
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
      <Button
        size="small"
        color={likedByMe ? 'error' : 'inherit'}
        startIcon={likedByMe ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        onClick={onLike}
        aria-pressed={likedByMe}
      >
        {label('Like', likeCount, t)}
      </Button>
      <Button
        size="small"
        color="inherit"
        startIcon={<ChatBubbleOutlineIcon />}
        component={RouterLink}
        to={`/social/posts/${postId}`}
      >
        {label('Comment', commentCount, t)}
      </Button>
      <Button size="small" color="inherit" startIcon={<ShareIcon />} onClick={onShare}>
        {label('Share', shareCount, t)}
      </Button>
    </Stack>
  );
}
