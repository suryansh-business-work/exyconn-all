import type { ReactNode } from 'react';
import { Box, Button, Chip, Grid, Link, Stack, Typography } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import { formatBytes } from '@exyconn/shell/utils/file';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { PlatformConfig } from './download.config';

/** The one installer file this hero offers. */
export interface HeroAsset {
  name: string;
  url: string;
  sizeBytes: number;
  downloadCount: number;
}

interface DownloadHeroProps {
  platform: PlatformConfig;
  asset: HeroAsset | null;
  version: string;
  releasedOn: string;
  releaseUrl: string;
  detected: boolean;
  picker: ReactNode;
}

/** Version, the primary download button for the chosen platform, and the picker. */
export function DownloadHero({
  platform,
  asset,
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
          background: `linear-gradient(135deg, ${platform.accent}1f 0%, transparent 55%)`,
        },
      ]}
    >
      <Grid container spacing={2.5} alignItems="center">
        <Grid item xs={12} md={7}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip size="small" label={`Version ${version}`} color="primary" />
            <Chip size="small" variant="outlined" label={`Released ${releasedOn}`} />
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Icon sx={{ fontSize: 34, color: platform.accent }} />
            <Typography variant="h4">Exyconn Tracker for {platform.label}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {subtitle}
          </Typography>

          {asset ? (
            <Stack spacing={0.75} alignItems="flex-start">
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                href={asset.url}
                sx={{ px: 3 }}
              >
                Download for {platform.label}
              </Button>
              <Typography variant="caption" color="text.secondary">
                {asset.name} · {formatBytes(asset.sizeBytes)} · {asset.downloadCount} downloads
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2" color="warning.main">
              This release has no {platform.label} installer. Ask Tech to run a build that includes
              it.
            </Typography>
          )}

          <Link
            href={releaseUrl}
            target="_blank"
            rel="noopener"
            variant="caption"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}
          >
            Release notes on GitHub <OpenInNewIcon sx={{ fontSize: 13 }} />
          </Link>
        </Grid>

        <Grid item xs={12} md={5}>
          {picker}
        </Grid>
      </Grid>
    </Box>
  );
}
