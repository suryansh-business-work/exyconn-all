import { Avatar, type SxProps, type Theme } from '@exyconn/shell/components/ui';
import { initialsOf } from './initials';

interface RecordAvatarProps {
  name: string;
  /** The uploaded logo or profile picture; empty shows the initials. */
  src: string;
  /** Companies are rounded squares, people are circles. */
  variant?: 'circular' | 'rounded';
  sx?: SxProps<Theme>;
}

/**
 * A company's logo or a contact's picture, with their initials when there is none (or when the
 * image fails to load). Decorative: the name always sits next to it.
 */
export function RecordAvatar({ name, src, variant = 'circular', sx }: Readonly<RecordAvatarProps>) {
  return (
    <Avatar alt="" src={src || undefined} variant={variant} sx={sx}>
      {initialsOf(name)}
    </Avatar>
  );
}
