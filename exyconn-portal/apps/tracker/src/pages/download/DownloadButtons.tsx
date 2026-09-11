import { Button, Stack, Typography } from '@exyconn/shell/components/ui';
import { formatBytes } from '@exyconn/shell/utils/file';
import DownloadIcon from '@mui/icons-material/Download';
import { assetKind, orderAssets } from './assetKind';

/** One downloadable file of the release, for the chosen platform. */
export interface HeroAsset {
  name: string;
  url: string;
  sizeBytes: number;
  downloadCount: number;
}

interface DownloadButtonProps {
  asset: HeroAsset;
  platformLabel: string;
}

function DownloadButton({ asset, platformLabel }: Readonly<DownloadButtonProps>) {
  const kind = assetKind(asset.name, platformLabel);
  const details = `${asset.name} · ${formatBytes(asset.sizeBytes)} · ${asset.downloadCount} downloads`;
  return (
    <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
      <Button
        variant={kind.primary ? 'contained' : 'outlined'}
        size="large"
        startIcon={<DownloadIcon />}
        href={asset.url}
        sx={{ px: 3 }}
      >
        {kind.label}
      </Button>
      {kind.caption === '' ? null : (
        <Typography variant="caption" sx={{ color: 'text.primary' }}>
          {kind.caption}
        </Typography>
      )}
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {details}
      </Typography>
    </Stack>
  );
}

interface Props {
  assets: readonly HeroAsset[];
  platformLabel: string;
}

/**
 * Every file the release has for the chosen platform — one for a desktop, two for Android (the
 * APK to install, the AAB for Google Play), the IPA for an iPhone — each labelled for what it is.
 */
export function DownloadButtons({ assets, platformLabel }: Readonly<Props>) {
  if (assets.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'warning.main' }}>
        This release has no {platformLabel} installer. Ask Tech to run a build that includes it.
      </Typography>
    );
  }
  return (
    <Stack spacing={1.5}>
      {orderAssets(assets, platformLabel).map((asset) => (
        <DownloadButton key={asset.name} asset={asset} platformLabel={platformLabel} />
      ))}
    </Stack>
  );
}
