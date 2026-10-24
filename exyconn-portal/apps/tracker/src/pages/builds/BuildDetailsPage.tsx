import { useNavigate, useParams } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  Card,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@exyconn/shell/components/ui';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { useTrackerBuildReleasesQuery } from '@exyconn/shell/graphql/generated';
import { PLATFORMS, type PlatformConfig } from '../download/download.config';
import { DownloadButtons } from '../download/DownloadButtons';
import { downloadFiles } from './downloadFiles';
import { installerUrls, type TrackerBuildReleaseRow } from './builds.types';

/** Back to the published list. */
const LIST_PATH = '/tracker/builds/published';

interface PlatformCardProps {
  platform: PlatformConfig;
  release: TrackerBuildReleaseRow;
}

/** One platform's installers on the build, or a line saying the build has none for it. */
function PlatformCard({ platform, release }: Readonly<PlatformCardProps>) {
  const t = useT();
  const Icon = platform.icon;
  const assets = release.assets.filter((asset) => asset.platform === platform.key);
  return (
    <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Icon aria-hidden />
        <Typography variant="subtitle1" component="h2">
          {t(platform.label)}
        </Typography>
      </Stack>
      <DownloadButtons assets={assets} platformLabel={platform.label} />
    </Card>
  );
}

/** One tracker build: its installers platform by platform — Windows, macOS, Linux, Android, iOS. */
export function BuildDetailsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { formatDateTime } = useFormatters();
  const releases = useTrackerBuildReleasesQuery({ fetchPolicy: 'cache-first' });
  const release = releases.data?.trackerBuildReleases.find((row) => row.id === id);
  const goBack = () => navigate(LIST_PATH);

  let body;
  if (release) {
    body = (
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: 'flex-start' }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
            {t('Published {date}', { date: formatDateTime(release.publishedAt) })}
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            disabled={release.assets.length === 0}
            onClick={() => downloadFiles(installerUrls([release]))}
          >
            {t('Download all')}
          </Button>
          <Button startIcon={<OpenInNewIcon />} href={release.url} target="_blank" rel="noreferrer">
            {t('Open on GitHub')}
          </Button>
        </Stack>
        <Grid container spacing={2}>
          {PLATFORMS.map((platform) => (
            <Grid key={platform.key} size={{ xs: 12, md: 6 }}>
              <PlatformCard platform={platform} release={release} />
            </Grid>
          ))}
        </Grid>
      </Stack>
    );
  } else if (releases.loading) {
    body = <Skeleton variant="rounded" height={240} />;
  } else {
    body = (
      <Alert severity={releases.error ? 'error' : 'warning'}>
        {releases.error?.message ?? t('This build no longer exists. It may have been deleted.')}
      </Alert>
    );
  }

  return (
    <CrudFormPage
      title="Build {version}"
      titleValues={{ version: release?.version ?? '' }}
      onBack={goBack}
      backLabel="Back to Builds"
    >
      {body}
    </CrudFormPage>
  );
}
