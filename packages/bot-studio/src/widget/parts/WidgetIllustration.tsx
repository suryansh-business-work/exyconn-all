import type { Illustration } from '@exyconn/wa-flow';
import { Box, Typography } from '@exyconn/shell/components/ui';
import { WA_ICONS } from '../../icons';
import { useWidgetLook } from '../widget.look';

interface WidgetIllustrationProps {
  image: Illustration;
  /** Height of the artwork; the icon scales with it. */
  height?: number;
}

/** An illustration (no real photo exists for demo content): the icon on its accent tint. */
export function WidgetIllustration({ image, height = 96 }: Readonly<WidgetIllustrationProps>) {
  const look = useWidgetLook(image.accent);
  const Icon = WA_ICONS[image.icon];
  return (
    <Box
      role="img"
      aria-label={image.title ?? image.icon}
      sx={{
        height,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        bgcolor: look.fill,
        color: look.onFill,
      }}
    >
      <Icon sx={{ fontSize: Math.round(height * 0.45) }} aria-hidden />
      {(image.title ?? image.subtitle) && (
        <Box sx={{ minWidth: 0 }}>
          {image.title && (
            <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700 }}>
              {image.title}
            </Typography>
          )}
          {image.subtitle && (
            <Typography variant="caption" component="p">
              {image.subtitle}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
