import { CARD_RADIUS, Box, Typography } from '@exyconn/shell/components/ui';

interface PostBodyProps {
  body: string;
  imageUrl: string;
}

/**
 * What somebody actually wrote, and the picture they attached.
 *
 * Rendered as plain text with newlines preserved rather than as markup: this is a feed
 * anyone in the company can post to, and the one thing it must not do is let one of them
 * put HTML on everybody else's screen.
 */
export function PostBody({ body, imageUrl }: Readonly<PostBodyProps>) {
  return (
    <>
      {body && (
        <Typography
          variant="body1"
          sx={{ mt: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {body}
        </Typography>
      )}
      {imageUrl && (
        <Box
          component="img"
          src={imageUrl}
          alt=""
          loading="lazy"
          sx={{ mt: 1.5, width: '100%', borderRadius: `${CARD_RADIUS}px`, display: 'block' }}
        />
      )}
    </>
  );
}
