import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import ExtensionIcon from '@mui/icons-material/Extension';
import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { IconBubble } from '@exyconn/shell/components/dashboard/IconBubble';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useMaLatestReleaseQuery } from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/ui';
import { LoadError } from '../lib/LoadError';
import { ChangelogDialog } from './ChangelogDialog';
import { DownloadSection } from './DownloadSection';
import { NoReleaseState } from './NoReleaseState';
import { ReleaseActions } from './ReleaseActions';
import { ReleaseFacts } from './ReleaseFacts';

/** The newest release for the company's channel: download it, install it, or learn why there is none. */
export function LatestReleaseCard() {
  const t = useT();
  const notify = useNotify();
  const { data, loading, error, refetch } = useMaLatestReleaseQuery({
    notifyOnNetworkStatusChange: true,
  });
  const [changelog, setChangelog] = useState(false);
  const release = data?.maLatestRelease;

  const checkUpdates = async () => {
    try {
      const result = await refetch();
      const latest = result.data?.maLatestRelease;
      if (latest) {
        notify('The newest release is version {version}', 'info', { version: latest.version });
      } else {
        notify('No release available yet', 'info');
      }
    } catch (error) {
      // The query's own error state shows the person what went wrong, with Retry.
      portalLogger.warn('Checking for extension updates failed', error);
    }
  };

  let body;
  if (error) {
    body = <LoadError message={error.message} onRetry={() => refetch()} />;
  } else if (!data) {
    body = <PanelSkeleton />;
  } else if (release) {
    body = (
      <>
        <DownloadSection release={release} />
        <ReleaseFacts release={release} />
        <ReleaseActions
          release={release}
          onChangelog={() => setChangelog(true)}
          onCheckUpdates={checkUpdates}
          checking={loading}
        />
      </>
    );
  } else {
    body = <NoReleaseState />;
  }

  return (
    <Box sx={panel}>
      <Flex direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <IconBubble icon={ExtensionIcon} accent={color.indigo[400]} />
        <Text size="sm" color="text.secondary">
          {t(
            'Records your Google Meet calls when you click Start, writes AI notes and action items, and emails the summary. Tell everyone in the call before you start recording.',
          )}
        </Text>
      </Flex>
      {body}
      <ChangelogDialog open={changelog} onClose={() => setChangelog(false)} />
    </Box>
  );
}
