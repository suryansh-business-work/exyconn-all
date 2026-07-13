import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { Branding } from '@shared/types';

const DEFAULT_NAME = 'Exyconn Tracker';

interface Props {
  branding: Branding | null;
  height?: number;
  showName?: boolean;
}

/** Prefer the dark-background logo when the palette is dark; fall back to the light one. */
function pickLogo(branding: Branding | null, isDark: boolean): string {
  if (branding === null) {
    return '';
  }
  if (isDark && branding.logoDarkUrl !== '') {
    return branding.logoDarkUrl;
  }
  return branding.logoUrl;
}

/** The portal logo, with a text wordmark as the fallback (missing or broken URL). */
export default function BrandMark({
  branding,
  height = 28,
  showName = false,
}: Readonly<Props>): JSX.Element {
  const theme = useTheme();
  const [broken, setBroken] = useState(false);
  const name = branding?.businessName ?? DEFAULT_NAME;
  const logo = pickLogo(branding, theme.palette.mode === 'dark');

  if (logo === '' || broken) {
    return (
      <Typography
        variant="h6"
        noWrap
        sx={{
          minWidth: 0,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          // The wordmark stands in for the logo, so it tracks the height asked of it.
          fontSize: Math.max(14, Math.round(height * 0.6)),
        }}
      >
        {name}
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
      <Box
        component="img"
        src={logo}
        alt={name}
        onError={() => setBroken(true)}
        sx={{ height, maxWidth: 180, objectFit: 'contain', display: 'block' }}
      />
      {showName ? (
        <Typography variant="subtitle2" noWrap color="text.secondary">
          {name}
        </Typography>
      ) : null}
    </Stack>
  );
}
