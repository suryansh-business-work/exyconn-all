import { Box } from '@exyconn/shell/components/ui';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_RADIUS, WA_SHADOW, WA_SPACE } from '../../../theme/wa.tokens';

/** "Today", "Yesterday" or a date, centred between days. */
export function DateChip({ label }: Readonly<{ label: string }>) {
  const c = useWaPalette();
  return (
    <Box
      role="separator"
      aria-label={label}
      sx={{
        alignSelf: 'center',
        my: WA_SPACE.md,
        px: WA_SPACE.md,
        py: WA_SPACE.xs,
        borderRadius: WA_RADIUS.chip,
        bgcolor: c.chip,
        color: c.chipText,
        fontSize: WA_FONT.small,
        boxShadow: WA_SHADOW.bubble,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Box>
  );
}
