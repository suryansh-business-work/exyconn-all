import { useMemo } from 'react';
import { Avatar, type SxProps, type Theme } from '@exyconn/shell/components/ui';
import { avatarSources } from './avatar/avatarSources';
import { useFirstLoadedImage } from './avatar/useFirstLoadedImage';
import { initialsOf } from './initials';

interface RecordAvatarProps {
  name: string;
  /** The uploaded logo or profile picture; empty (or not https) skips it. */
  src: string;
  /** A company's domain: its favicon stands in when there is no logo. */
  domain?: string;
  /** Companies are rounded squares, people are circles. */
  variant?: 'circular' | 'rounded';
  sx?: SxProps<Theme>;
}

/**
 * A company's logo or a contact's picture; for a company without one, its website's favicon;
 * otherwise their initials. An image is shown only once it has loaded, so a missing or broken
 * one falls back instead of showing a broken picture. Decorative: the name always sits next to it.
 */
export function RecordAvatar({
  name,
  src,
  domain = '',
  variant = 'circular',
  sx,
}: Readonly<RecordAvatarProps>) {
  const sources = useMemo(() => avatarSources(src, domain), [src, domain]);
  const loaded = useFirstLoadedImage(sources);
  return (
    <Avatar alt="" src={loaded || undefined} variant={variant} sx={sx}>
      {initialsOf(name)}
    </Avatar>
  );
}
