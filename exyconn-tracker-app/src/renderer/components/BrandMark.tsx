import type { ReactElement } from 'react';
import { useState } from 'react';
import { Box, Stack, Typography, useTheme } from '@exyconn/ui';
import type { Branding } from '@shared/types';
// The tracker's own icon (the tray's): the portal's "app icon" is often its wide logo again.
import appIcon from '../../../resources/tray.png';

const DEFAULT_NAME = 'Exyconn Tracker';

interface Props {
  branding: Branding | null;
  height?: number;
  showName?: boolean;
}

interface WordmarkProps {
  name: string;
  height: number;
}

/**
 * The name typeset in the theme's own ink, beside the tracker's icon. Used on the dark palette
 * and whenever there is no logo: a dark-ground logo is often the light one uploaded again (the
 * Exyconn workspace's logo, dark logo and app icon are one dark-ink image), and a logo that
 * vanishes on its ground is worse than plain type.
 */
function Wordmark({ name, height }: Readonly<WordmarkProps>): ReactElement {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box
        component="img"
        src={appIcon}
        alt=""
        sx={{ height, width: height, objectFit: 'contain', display: 'block', flexShrink: 0 }}
      />
      <Typography
        variant="h6"
        noWrap
        sx={{
          minWidth: 0,
          color: 'text.primary',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          // The wordmark stands in for the logo, so it tracks the height asked of it.
          fontSize: Math.max(14, Math.round(height * 0.75)),
        }}
      >
        {name}
      </Typography>
    </Stack>
  );
}

/**
 * The workspace's brand: its logo on the light palette, and its name in the theme's ink beside
 * the app icon on the dark one (or when the logo is missing or broken).
 */
export default function BrandMark({
  branding,
  height = 28,
  showName = false,
}: Readonly<Props>): ReactElement {
  const theme = useTheme();
  const [broken, setBroken] = useState(false);
  const name = branding?.businessName ?? DEFAULT_NAME;
  const logo = branding?.logoUrl ?? '';

  if (theme.palette.mode === 'dark' || logo === '' || broken) {
    return <Wordmark name={name} height={height} />;
  }

  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: 'center',
        minWidth: 0,
      }}
    >
      <Box
        component="img"
        src={logo}
        alt={name}
        onError={() => setBroken(true)}
        sx={{ height, maxWidth: 180, objectFit: 'contain', display: 'block' }}
      />
      {showName ? (
        <Typography
          variant="subtitle2"
          noWrap
          sx={{
            color: 'text.secondary',
          }}
        >
          {name}
        </Typography>
      ) : null}
    </Stack>
  );
}
