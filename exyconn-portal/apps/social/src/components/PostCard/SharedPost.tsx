import { Box, Typography } from '@exyconn/shell/components/ui';
import type { SocialPostFieldsFragment } from '@exyconn/shell/graphql/generated';
import { AuthorLine } from '../AuthorLine';
import { PostBody } from './PostBody';

/** The original a share points at — never a copy of it, always the post as it stands now. */
type SharedOriginal = NonNullable<SocialPostFieldsFragment['sharedFrom']>;

interface SharedPostProps {
  original: SharedOriginal;
}

/**
 * The quoted original inside a shared post, boxed off so it is obvious whose words are
 * whose. Its own actions are deliberately absent: liking belongs on the original, which
 * is one tap away on its author's byline.
 */
export function SharedPost({ original }: Readonly<SharedPostProps>) {
  return (
    <Box
      sx={{
        mt: 1.5,
        p: 2,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      <AuthorLine author={original.author} at={original.createdAt} dense />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Originally posted
      </Typography>
      <PostBody body={original.body} imageUrl={original.imageUrl} />
    </Box>
  );
}
