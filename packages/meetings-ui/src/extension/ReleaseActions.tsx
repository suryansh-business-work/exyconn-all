import { useT } from '@exyconn/i18n';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Button, Flex } from '@exyconn/shell/components/ui';
import type { MaReleaseFieldsFragment } from '@exyconn/shell/graphql/generated';

interface ReleaseActionsProps {
  release: MaReleaseFieldsFragment;
  onChangelog: () => void;
  onCheckUpdates: () => void;
  checking: boolean;
}

/**
 * The other things to do with a release. The store button shows only once a store listing
 * exists — the link is never made up. The ZIP download is the card's main action above.
 */
export function ReleaseActions({
  release,
  onChangelog,
  onCheckUpdates,
  checking,
}: Readonly<ReleaseActionsProps>) {
  const t = useT();
  return (
    <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
      {release.storeUrl && (
        <Button
          variant="outlined"
          startIcon={<StorefrontIcon />}
          href={release.storeUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('Install from Chrome Web Store')}
        </Button>
      )}
      <Button startIcon={<RefreshIcon />} onClick={onCheckUpdates} loading={checking}>
        {t('Check for updates')}
      </Button>
      <Button startIcon={<HistoryIcon />} onClick={onChangelog}>
        {t('View changelog')}
      </Button>
    </Flex>
  );
}
