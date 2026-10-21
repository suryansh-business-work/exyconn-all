import { useT } from '@exyconn/i18n';
import DownloadIcon from '@mui/icons-material/Download';
import { Box, Button } from '@exyconn/shell/components/ui';
import type { MaReleaseFieldsFragment } from '@exyconn/shell/graphql/generated';
import { useReleaseDownload } from '../releases/useReleaseDownload';
import { InstallSteps } from './InstallSteps';

/** The release's ZIP as the page's main action, with how to install it right under it. */
export function DownloadSection({ release }: Readonly<{ release: MaReleaseFieldsFragment }>) {
  const t = useT();
  const { download, loading } = useReleaseDownload();
  return (
    <Box sx={{ mb: 3 }}>
      <Button
        variant="contained"
        size="large"
        startIcon={<DownloadIcon />}
        disabled={!release.downloadable}
        loading={loading}
        onClick={() => download(release.id)}
      >
        {t('Download extension (.zip)')}
      </Button>
      <InstallSteps />
    </Box>
  );
}
