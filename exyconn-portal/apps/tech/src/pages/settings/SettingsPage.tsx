import { useMemo } from 'react';
import { Box, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import {
  useListSlackChannelsQuery,
  useTrackerBuildSettingsQuery,
} from '@exyconn/shell/graphql/generated';
import { TrackerNotificationsForm } from './forms/tracker-notifications';

/**
 * Only a private channel the bot has not joined actually blocks a build: the
 * workflow adds the bot to a public channel itself, but Slack does not allow that
 * for a private one, so those need an /invite before they will accept a post.
 */
function channelLabel(name: string, isPrivate: boolean, isMember: boolean): string {
  if (isPrivate && !isMember) {
    return `#${name} (private, needs /invite)`;
  }
  return isPrivate ? `#${name} (private)` : `#${name}`;
}

/**
 * Tech settings. Today that is where a finished tracker build is announced: the
 * Slack channel list comes from the bot token configured under Environment
 * Variables, so every channel the bot can see is offered.
 */
export function SettingsPage() {
  const channels = useListSlackChannelsQuery({ fetchPolicy: 'cache-and-network' });
  const settings = useTrackerBuildSettingsQuery({ fetchPolicy: 'cache-and-network' });

  const options: SelectOption[] = useMemo(
    () =>
      (channels.data?.listSlackChannels ?? []).map((c) => ({
        value: c.id,
        label: channelLabel(c.name, c.isPrivate, c.isMember),
      })),
    [channels.data],
  );

  const saved = settings.data?.trackerBuildSettings.slackChannels ?? [];
  const ready = !channels.loading && !settings.loading;

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Where tracker builds are announced" />
      <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
        {channels.error && (
          <Text size="sm" color="error.main" sx={{ mb: 2 }}>
            {channels.error.message}
          </Text>
        )}
        {!ready && <Text size="sm">Loading channels…</Text>}
        {ready && (
          <TrackerNotificationsForm
            options={options}
            initial={saved}
            onCancel={() => settings.refetch()}
            onDone={() => settings.refetch()}
          />
        )}
      </Box>
    </Box>
  );
}
