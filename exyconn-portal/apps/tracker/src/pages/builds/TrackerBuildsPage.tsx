import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import TuneIcon from '@mui/icons-material/Tune';
import { useT } from '@exyconn/i18n';
import { Box, Card } from '@exyconn/shell/components/ui';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import {
  ListTrackerBuildsDocument,
  useTrackerBuildSettingsQuery,
} from '@exyconn/shell/graphql/generated';
import { useApolloClient } from '@apollo/client/react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { BuildReleasesTab } from './BuildReleasesTab';
import { BuildRunsTab } from './BuildRunsTab';
import { StartBuildForm } from './forms/start-build';
import { BuildRetentionForm } from './forms/build-retention';

/** Where the page lives; each tab is a slug under it. */
const BASE_PATH = '/tracker/builds';

/**
 * Tracker Builds — every published build of the desktop and phone trackers, the workflow runs
 * behind them, starting a new build (raising the version first), and how many to keep.
 */
export function TrackerBuildsPage() {
  const t = useT();
  const navigate = useNavigate();
  const client = useApolloClient();
  const [starting, setStarting] = useState(false);
  const settings = useTrackerBuildSettingsQuery({ fetchPolicy: 'cache-and-network' });
  const stored = settings.data?.trackerBuildSettings;

  const onStarted = () => {
    setStarting(false);
    client
      .refetchQueries({ include: [ListTrackerBuildsDocument] })
      .catch((error: unknown) =>
        portalLogger.error('Tracker builds: refreshing runs failed', error),
      );
    navigate(`${BASE_PATH}/runs`);
  };

  if (starting) {
    return (
      <CrudFormPage
        title="Create tracker build"
        onBack={() => setStarting(false)}
        backLabel="Back to Builds"
      >
        <StartBuildForm
          channelCount={stored?.slackChannels.length ?? 0}
          onCancel={() => setStarting(false)}
          onDone={onStarted}
        />
      </CrudFormPage>
    );
  }

  const tabs: TabberItem[] = [
    {
      slug: 'published',
      label: t('Published'),
      icon: <Inventory2Icon />,
      content: <BuildReleasesTab />,
    },
    { slug: 'runs', label: t('Runs'), icon: <PlayCircleIcon />, content: <BuildRunsTab /> },
    {
      slug: 'settings',
      label: t('Settings'),
      icon: <TuneIcon />,
      content: (
        <Card variant="outlined" sx={{ p: 2 }}>
          <BuildRetentionForm keepLatestBuilds={stored?.keepLatestBuilds ?? 0} />
        </Card>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Builds"
        subtitle="Build the tracker for Windows, macOS, Linux, Android and iOS"
        actionLabel="Create build"
        onAction={() => setStarting(true)}
      />
      <Tabber basePath={BASE_PATH} items={tabs} ariaLabel="Build views" />
    </Box>
  );
}
