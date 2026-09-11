import type { ReactNode } from 'react';
import {
  Box,
  Chip,
  Grid,
  Link,
  Stack,
  Typography,
  iconSize,
  tint,
} from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { PlatformConfig } from './download.config';
import { DownloadButtons, type HeroAsset } from './DownloadButtons';

interface DownloadHeroProps {
  platform: PlatformConfig;
  /** Every file the release has for this platform — Android has two. */
  assets: readonly HeroAsset[];
  version: string;
  releasedOn: string;
  releaseUrl: string;
  detected: boolean;
  picker: ReactNode;
}

/** Version, the download buttons for the chosen platform, and the picker. */
export function DownloadHero({
  platform,
  assets,
  version,
  releasedOn,
  releaseUrl,
  detected,
  picker,
}: Readonly<DownloadHeroProps>) {
  const Icon = platform.icon;
  const subtitle = detected
    ? `We detected ${platform.label}, so this is the build for you.`
    : `Showing the ${platform.label} build — switch platform on the right.`;

  return (
    <Box
      sx={[
        glass,
        {
          p: { xs: 2, md: 3 },
          mb: 1.5,
          background: `linear-gradient(135deg, ${tint(platform.accent, 'soft')} 0%, transparent 55%)`,
        },
      ]}
    >
      <Grid
        container
        spacing={2.5}
        sx={{
          alignItems: 'center',
        }}
      >
        <Grid
          size={{
            xs: 12,
            md: 7,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip size="small" label={`Version ${version}`} color="primary" />
            <Chip size="small" variant="outlined" label={`Released ${releasedOn}`} />
          </Stack>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: 'center',
              mb: 0.5,
            }}
          >
            <Icon sx={{ fontSize: iconSize['3xl'], color: platform.accent }} />
            <Typography variant="h4">Exyconn Tracker for {platform.label}</Typography>
          </Stack>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 2,
            }}
          >
            {subtitle}
          </Typography>

          <DownloadButtons assets={assets} platformLabel={platform.label} />

          <Link
            href={releaseUrl}
            target="_blank"
            rel="noopener"
            variant="caption"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}
          >
            Release notes on GitHub <OpenInNewIcon sx={{ fontSize: iconSize.xs }} />
          </Link>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 5,
          }}
        >
          {picker}
        </Grid>
      </Grid>
    </Box>
  );
}
