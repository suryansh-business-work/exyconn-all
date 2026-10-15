import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, radius } from '@exyconn/shell/components/ui';

/** The bezel, the screen inside it and the camera notch, sized off the theme's spacing. */
const FRAME = {
  width: 40,
  bezel: 1.25,
  notchWidth: 12,
  notchHeight: 3,
  outerRadius: radius.xxl * 2,
  screenRadius: radius.xxl + radius.lg,
} as const;

/** A phone drawn around its children, so the browser call looks like the call it is. */
export function PhoneFrame({ children }: Readonly<{ children: ReactNode }>) {
  const t = useT();
  return (
    <Box
      role="group"
      aria-label={t('Phone call with the AI calling bot')}
      sx={{
        mx: 'auto',
        width: (theme) => `min(100%, ${theme.spacing(FRAME.width)})`,
        aspectRatio: '9 / 18',
        p: FRAME.bezel,
        bgcolor: 'common.black',
        borderRadius: `${FRAME.outerRadius}px`,
        boxShadow: 12,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
          bgcolor: 'background.default',
          color: 'text.primary',
          borderRadius: `${FRAME.screenRadius}px`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: (theme) => theme.spacing(1),
            left: '50%',
            transform: 'translateX(-50%)',
            width: (theme) => theme.spacing(FRAME.notchWidth),
            height: (theme) => theme.spacing(FRAME.notchHeight),
            bgcolor: 'common.black',
            borderRadius: `${radius.pill}px`,
          }}
        />
        {children}
      </Box>
    </Box>
  );
}
