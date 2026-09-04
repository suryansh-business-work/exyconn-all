import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Grid, Skeleton, Stack } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { withParam } from '@exyconn/shell/utils/searchParams';
import {
  useMyTrackerAccessQuery,
  useTrackerLatestReleaseQuery,
} from '@exyconn/shell/graphql/generated';
import type { PlatformKey } from './download.config';
import { detectPlatform, platformFor } from './detectPlatform';
import { DownloadHero } from './DownloadHero';
import { PlatformPicker } from './PlatformPicker';
import { InstallGuide } from './InstallGuide';
import { SystemRequirements } from './SystemRequirements';
import { ReadinessCard } from './ReadinessCard';

/** Query-string key holding which installer is on screen. */
const PLATFORM_PARAM = 'platform';

/**
 * Download console for the desktop tracker. The build, its version and the installer
 * URLs come from the latest `tracker-v*` GitHub release; the platform on screen lives
 * in the URL (`/tracker/download?platform=macos`) and defaults to the visitor's own.
 */
export function TrackerDownloadPage() {
  const { formatDate } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const releaseQuery = useTrackerLatestReleaseQuery({ fetchPolicy: 'cache-and-network' });
  const accessQuery = useMyTrackerAccessQuery();

  const detected = useMemo(() => detectPlatform(globalThis.navigator.userAgent), []);
  const platform = platformFor(searchParams.get(PLATFORM_PARAM)) ?? detected;

  const selectPlatform = useCallback(
    (key: PlatformKey) => {
      setSearchParams((current) => withParam(current, PLATFORM_PARAM, key), { replace: true });
    },
    [setSearchParams],
  );

  const release = releaseQuery.data?.trackerLatestRelease ?? null;
  const asset = release?.assets.find((entry) => entry.platform === platform.key) ?? null;
  const available = new Set((release?.assets ?? []).map((entry) => entry.platform));
  const access = accessQuery.data?.myTrackerAccess ?? null;

  const header = (
    <PageHeader
      title="Download Tracker"
      subtitle="Exyconn Tracker for Windows, macOS & Linux — always the latest build"
    />
  );

  if (releaseQuery.loading && !release) {
    return (
      <>
        {header}
        <Stack spacing={1.5}>
          <Skeleton variant="rounded" height={220} />
          <Skeleton variant="rounded" height={280} />
        </Stack>
      </>
    );
  }

  if (releaseQuery.error || !release) {
    return (
      <>
        {header}
        <Alert severity="warning">
          {releaseQuery.error?.message ??
            'No published tracker build yet. Ask Tech to run a build from Tech › Tracker Build.'}
        </Alert>
      </>
    );
  }

  return (
    <>
      {header}
      <DownloadHero
        platform={platform}
        asset={asset}
        version={release.version}
        releasedOn={formatDate(release.publishedAt)}
        releaseUrl={release.url}
        detected={platform.key === detected.key}
        picker={
          <PlatformPicker
            selected={platform.key}
            detected={detected.key}
            available={available}
            onSelect={selectPlatform}
          />
        }
      />

      <ReadinessCard
        hasAccess={Boolean(access?.isActive)}
        consented={Boolean(access?.consentedAt)}
        loading={accessQuery.loading}
      />

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={6}>
          <InstallGuide platform={platform} />
        </Grid>
        <Grid item xs={12} md={6}>
          <SystemRequirements platform={platform} />
        </Grid>
      </Grid>
    </>
  );
}
