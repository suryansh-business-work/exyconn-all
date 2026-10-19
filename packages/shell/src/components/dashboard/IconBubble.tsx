import type { SvgIconComponent } from '@mui/icons-material';
import { Box, borderWidth, pastelTone, useTheme } from '@/components/ui';

/** A stat tile's bubble; the portal switcher's is a step smaller. */
export const BUBBLE_SIZE = 44;

interface IconBubbleProps {
  icon: SvgIconComponent;
  /** Any accent — a module's, a stat's. The bubble is tinted from it and its icon kept at 3:1. */
  accent: string;
  size?: number;
}

/**
 * An icon in a circular pastel bubble: a soft tint of the accent, a translucent ring of the same
 * hue, and the accent itself as the icon, moved just far enough to read at 3:1 on the tint
 * (SC 1.4.11). Decorative — the label beside it carries the meaning — so it is hidden from
 * assistive technology.
 */
export function IconBubble({ icon: Icon, accent, size = BUBBLE_SIZE }: Readonly<IconBubbleProps>) {
  const theme = useTheme();
  const tone = pastelTone(accent, theme.palette.background.paper, theme.palette.mode);
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        bgcolor: tone.fill,
        color: tone.ink,
        // The ring sits over the surface, not over the fill, so it reads as a soft halo.
        border: `${borderWidth.accent}px solid ${tone.ring}`,
        backgroundClip: 'padding-box',
      }}
    >
      {/* Half the bubble: room for the ring and air round the glyph. */}
      <Icon sx={{ fontSize: size / 2 }} />
    </Box>
  );
}
