import { Link as RouterLink } from 'react-router-dom';
import { Avatar, Box, Link, Stack, Typography } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { SocialAuthorFieldsFragment } from '@exyconn/shell/graphql/generated';

interface AuthorLineProps {
  author: SocialAuthorFieldsFragment;
  /** When the thing being bylined was written. */
  at: string;
  /** Smaller, for a comment sitting under a post. */
  dense?: boolean;
}

/** `Designation · Department`, with the separator only where there are two sides to it. */
function roleOf(author: SocialAuthorFieldsFragment): string {
  return [author.designation, author.department].filter(Boolean).join(' · ');
}

/**
 * The byline over a post or a comment: who wrote it, what they do, and how long ago.
 *
 * The name is a link to their profile everywhere it appears — the whole point of putting
 * a colleague's face on the feed is that you can then find out who they are.
 */
export function AuthorLine({ author, at, dense = false }: Readonly<AuthorLineProps>) {
  const { formatRelative } = useSettings();
  const role = roleOf(author);
  const size = dense ? 32 : 44;

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: 'center',
      }}
    >
      <Avatar
        src={author.avatarUrl ?? undefined}
        alt={author.name}
        sx={{ width: size, height: size }}
      >
        {author.name.charAt(0)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Link
          component={RouterLink}
          to={`/social/people/${author.id}`}
          underline="hover"
          variant={dense ? 'body2' : 'subtitle2'}
          sx={{
            color: 'text.primary',
            fontWeight: 600,
          }}
        >
          {author.name}
        </Link>
        <Typography
          variant="caption"
          component="div"
          noWrap
          sx={{
            color: 'text.secondary',
          }}
        >
          {role ? `${role} · ` : ''}
          {formatRelative(at)}
        </Typography>
      </Box>
    </Stack>
  );
}
