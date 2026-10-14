import { useT } from '@exyconn/i18n';
import { Box, keyframes } from '@exyconn/shell/components/ui';
import { useWaPalette } from '../../../theme/useWa';
import { WA_RADIUS, WA_SHADOW, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-3px); opacity: 1; }
`;

const DOTS = ['one', 'two', 'three'];
const DOT = WA_SIZE.typingDot;

/** Three bouncing dots while the business is "typing". */
export function TypingBubble() {
  const t = useT();
  const c = useWaPalette();
  return (
    <Box
      role="status"
      aria-label={t('typing…')}
      sx={{ display: 'flex', px: WA_SPACE.sm, mt: WA_SPACE.md }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: WA_SPACE.xxs,
          px: WA_SPACE.md,
          py: WA_SPACE.md,
          bgcolor: c.bubbleIn,
          borderRadius: WA_RADIUS.bubble,
          borderTopLeftRadius: 0,
          boxShadow: WA_SHADOW.bubble,
        }}
      >
        {DOTS.map((id, i) => (
          <Box
            key={id}
            sx={{
              width: DOT,
              height: DOT,
              borderRadius: WA_RADIUS.pill,
              bgcolor: c.textMuted,
              animation: `${bounce} 1.2s ${i * 0.15}s infinite ease-in-out`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
