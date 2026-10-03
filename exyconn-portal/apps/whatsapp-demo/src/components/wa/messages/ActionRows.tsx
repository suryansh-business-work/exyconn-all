import type { ReactNode } from 'react';
import { Box, ButtonBase } from '@exyconn/shell/components/ui';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_LINE, WA_RADIUS, WA_SHADOW, WA_SPACE } from '../../../theme/wa.tokens';

export interface ActionRowItem {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

/** The buttons hanging under an interactive message — one full-width row each. */
export function ActionRows({ mine, items }: Readonly<{ mine: boolean; items: ActionRowItem[] }>) {
  const c = useWaPalette();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: WA_SPACE.hair, mt: WA_SPACE.hair }}>
      {items.map((item) => (
        <ButtonBase
          key={item.id}
          onClick={item.onClick}
          sx={{
            gap: WA_SPACE.xs,
            py: WA_SPACE.sm,
            px: WA_SPACE.md,
            bgcolor: mine ? c.bubbleOut : c.bubbleIn,
            color: c.link,
            borderRadius: WA_RADIUS.bubble,
            boxShadow: WA_SHADOW.bubble,
            fontFamily: 'inherit',
            fontSize: WA_FONT.message,
            fontWeight: 500,
            '&:hover': { bgcolor: c.rowHover },
            '&:focus-visible': {
              outline: `${WA_LINE.focus} solid ${c.link}`,
              outlineOffset: `-${WA_LINE.focus}`,
            },
          }}
        >
          {item.icon}
          {item.label}
        </ButtonBase>
      ))}
    </Box>
  );
}
