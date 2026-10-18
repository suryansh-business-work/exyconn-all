import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import {
  useMeetingSettingsQuery,
  useMeetingSlackChannelsQuery,
} from '@exyconn/shell/graphql/generated';
import { MeetingSettingsForm } from './forms/meeting-settings';

/** Meetings > Settings: the booking page address, Slack, and the fixed video rooms. */
export function MeetingSettingsPanel() {
  const t = useT();
  const settings = useMeetingSettingsQuery();
  const slack = useMeetingSlackChannelsQuery();
  const channels = useMemo<SelectOption[]>(
    () => [
      { value: '', label: t("Don't post to Slack") },
      ...(slack.data?.meetingSlackChannels ?? []).map((channel) => ({
        value: channel.id,
        label:
          channel.isPrivate && !channel.isMember
            ? `#${channel.name} (needs /invite)`
            : `#${channel.name}`,
      })),
    ],
    [slack.data, t],
  );
  const initial = settings.data?.meetingSettings;

  return (
    <Box>
      <PageHeader
        title="Meeting settings"
        subtitle="Your booking page address, Slack alerts and the video room every booking gets"
      />
      {settings.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage(settings.error, t('Could not load the meeting settings.'))}
        </Alert>
      )}
      {slack.error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {errorMessage(
            slack.error,
            t('Slack is not connected, so bookings cannot be posted there.'),
          )}
        </Alert>
      )}
      {initial ? (
        <MeetingSettingsForm initial={initial} channels={channels} />
      ) : (
        settings.loading && <PanelSkeleton lines={6} />
      )}
    </Box>
  );
}
