import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Divider, Link, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import { appUrl } from '@exyconn/shell/config/apps';
import {
  useMaReleaseSettingsQuery,
  useMaReleaseSlackChannelsQuery,
  useMaUpdateReleaseRetentionMutation,
} from '@exyconn/shell/graphql/generated';
import { BuildRetentionForm } from '@exyconn/shell/components/form/build-retention';

import { LoadError } from '../lib/LoadError';
import { ReleaseSettingsForm } from '../forms/release-settings';

/** Where Tech saves the Slack bot token. */
const TECH_SLACK_PATH = '/tech/environment-variables/slack';

/** Says plainly that Slack is not set up, and where to set it up. */
function SlackMissing() {
  const t = useT();
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      {t('Slack is not set up, so releases cannot be announced. Add it in')}{' '}
      <Link href={appUrl('tech', TECH_SLACK_PATH)}>
        {t('Tech > Environment Variables > Slack')}
      </Link>
      .
    </Alert>
  );
}

/** The release settings, in a dialog on the Releases page. */
export function ReleaseSettingsDialog({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const t = useT();
  const settings = useMaReleaseSettingsQuery({ skip: !open });
  const configured = settings.data?.maReleaseSettings.slackConfigured ?? false;
  const slack = useMaReleaseSlackChannelsQuery({ skip: !open || !configured });
  const channels = useMemo<SelectOption[]>(() => {
    const found = slack.data?.maReleaseSlackChannels ?? [];
    if (found.length === 0) {
      return [];
    }
    return [
      { value: '', label: t("Don't post to Slack") },
      ...found.map((channel) => ({ value: channel.id, label: `#${channel.name}` })),
    ];
  }, [slack.data, t]);
  const current = settings.data?.maReleaseSettings;
  // The settings have no id, so the cache cannot match the saved row to the query: read it again.
  const [saveRetention] = useMaUpdateReleaseRetentionMutation({
    refetchQueries: ['MaReleaseSettings'],
  });

  let body;
  if (settings.error) {
    body = <LoadError message={settings.error.message} onRetry={() => settings.refetch()} />;
  } else if (current && (!configured || slack.data || slack.error)) {
    body = (
      <>
        {!configured && <SlackMissing />}
        {slack.error && <LoadError message={slack.error.message} onRetry={() => slack.refetch()} />}
        <ReleaseSettingsForm
          initial={{
            allowedRepository: current.allowedRepository,
            slackChannelId: current.slackChannelId,
            notifyOnNewBuild: current.notifyOnNewBuild,
          }}
          channels={channels}
          onDone={onClose}
          onCancel={onClose}
        />
        <Divider sx={{ my: 3 }} />
        <Text component="h3" size="sm" weight="bold" sx={{ mb: 1.5 }}>
          {t('Build retention')}
        </Text>
        <BuildRetentionForm
          keepLatestBuilds={current.keepLatestBuilds}
          save={(keepLatestBuilds) => saveRetention({ variables: { keepLatestBuilds } })}
        />
      </>
    );
  } else {
    body = <PanelSkeleton />;
  }

  return (
    <CrudDialog open={open} title={t('Release settings')} onClose={onClose}>
      {body}
    </CrudDialog>
  );
}
