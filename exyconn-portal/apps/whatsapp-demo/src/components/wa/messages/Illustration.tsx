import { Box } from '@exyconn/shell/components/ui';
import type { Illustration as IllustrationData } from '@exyconn/wa-flow';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_RADIUS, WA_SPACE } from '../../../theme/wa.tokens';
import { WA_ICONS } from '../icons';

interface IllustrationProps {
  image: IllustrationData;
  height: string;
}

/** A picture drawn from an icon on a tinted tile — demos ship no photos. */
export function Illustration({ image, height }: Readonly<IllustrationProps>) {
  const c = useWaPalette();
  const Icon = WA_ICONS[image.icon];
  const tint = c.accents[image.accent];
  return (
    <Box
      role="img"
      aria-label={image.title ?? image.icon}
      sx={{
        height,
        borderRadius: WA_RADIUS.card,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: WA_SPACE.xxs,
        p: WA_SPACE.md,
        textAlign: 'center',
        color: c.qrPaper,
        background: `linear-gradient(135deg, ${tint}, ${c.accents.slate})`,
        overflow: 'hidden',
      }}
    >
      <Icon sx={{ fontSize: `calc(${height} * 0.36)`, opacity: 0.95 }} />
      {image.title ? (
        <Box sx={{ fontWeight: 700, fontSize: WA_FONT.title }}>{image.title}</Box>
      ) : null}
      {image.subtitle ? (
        <Box sx={{ fontSize: WA_FONT.small, opacity: 0.9 }}>{image.subtitle}</Box>
      ) : null}
    </Box>
  );
}
