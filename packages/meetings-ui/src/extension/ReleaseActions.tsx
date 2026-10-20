import { useT } from '@exyconn/i18n';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Button, Flex } from '@exyconn/shell/components/ui';
import type { MaReleaseFieldsFragment } from '@exyconn/shell/graphql/generated';
import { useReleaseDownload } from '../releases/useReleaseDownload';

interface ReleaseActionsProps {
  release: MaReleaseFieldsFragment;
  onGuide: () => void;
  onChangelog: () => void;
  onCheckUpdates: () => void;
  checking: boolean;
}

/**
 * Ways to get the extension. The store button is live only once a store listing exists — the
 * link is never made up — and the internal ZIP only when the build can be downloaded.
 */
export function ReleaseActions({
  release,
  onGuide,
  onChangelog,
  onCheckUpdates,
  checking,
}: Readonly<ReleaseActionsProps>) {
  const t = useT();
  const { download, loading } = useReleaseDownload();
  const storeUrl = release.storeUrl || undefined;
  return (
    <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
      <Button
        variant="contained"
        startIcon={<StorefrontIcon />}
        disabled={!storeUrl}
        href={storeUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('Install from Chrome Web Store')}
      </Button>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        disabled={!release.downloadable}
        loading={loading}
        onClick={() => download(release.id)}
      >
        {t('Download internal ZIP')}
      </Button>
      <Button startIcon={<MenuBookIcon />} onClick={onGuide}>
        {t('Installation guide')}
      </Button>
      <Button startIcon={<RefreshIcon />} onClick={onCheckUpdates} loading={checking}>
        {t('Check for updates')}
      </Button>
      <Button startIcon={<HistoryIcon />} onClick={onChangelog}>
        {t('View changelog')}
      </Button>
    </Flex>
  );
}
