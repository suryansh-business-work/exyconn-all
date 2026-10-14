import { Avatar } from '@exyconn/shell/components/ui';
import type { AccentKey, IconKey } from '@exyconn/wa-flow';
import { useWaPalette } from '../../../theme/useWa';
import { WA_RADIUS } from '../../../theme/wa.tokens';
import { WA_ICONS } from '../icons';

interface WaAvatarProps {
  /** Accessible name; the avatar is decorative when the name is already beside it. */
  label?: string;
  size: string;
  accent: AccentKey;
  icon?: IconKey;
  /** Shown instead of an icon — the viewer's own initials. */
  initials?: string;
}

/** A round avatar: an icon on the business's accent, or initials. */
export function WaAvatar({ label, size, accent, icon, initials }: Readonly<WaAvatarProps>) {
  const c = useWaPalette();
  const Icon = icon ? WA_ICONS[icon] : undefined;
  return (
    <Avatar
      alt={label}
      aria-hidden={label ? undefined : true}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: WA_RADIUS.pill,
        bgcolor: c.accents[accent],
        color: c.onBadge,
        fontSize: `calc(${size} * 0.4)`,
        fontWeight: 600,
      }}
    >
      {Icon ? <Icon sx={{ fontSize: `calc(${size} * 0.56)`, color: c.qrPaper }} /> : initials}
    </Avatar>
  );
}
