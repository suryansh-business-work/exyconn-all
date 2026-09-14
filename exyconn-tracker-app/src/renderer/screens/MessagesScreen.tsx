import type { ReactElement } from 'react';
import { useId, useState } from 'react';
import { Alert, Stack, Tab, Tabs, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { TrackerMessageKind } from '@shared/types';
import MessageComposer from '../components/MessageComposer';
import MessageList from '../components/MessageList';
import useMessages from '../hooks/useMessages';
import { panelProps, tabProps } from '../a11y/tabs';
import { useAnnounce } from '../a11y/LiveAnnouncer';

interface Props {
  /** Every timestamp on this screen is read in the employee's own zone, like everywhere else. */
  timezone: string;
}

/**
 * The employee's own line to whoever administers tracking, and the announcements sent to them.
 *
 * Two tabs rather than one merged feed: a reply written to this person and a notice pushed to
 * the whole company are different kinds of message, and threading them together would make
 * every broadcast look like something they were personally written to about.
 *
 * Announcements are read-only here — they arrive as desktop notifications while the app sits
 * in the tray, and this is where they can be found again afterwards.
 */
export default function MessagesScreen({ timezone }: Readonly<Props>): ReactElement {
  const t = useT();
  const tabs = useId();
  const [tab, setTab] = useState<TrackerMessageKind>('CHAT');
  const { messages, loading, error, sending, send } = useMessages(tab);
  useAnnounce(error, 'assertive');

  return (
    <Stack spacing={2}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {t('Between you and whoever administers tracking in your workspace.')}
      </Typography>

      <Tabs
        value={tab}
        onChange={(_event, next: TrackerMessageKind) => setTab(next)}
        variant="fullWidth"
        aria-label={t('Message view')}
      >
        <Tab value="CHAT" label={t('Chat')} {...tabProps(tabs, 'CHAT')} />
        <Tab value="NOTICE" label={t('Announcements')} {...tabProps(tabs, 'NOTICE')} />
      </Tabs>

      {error !== null ? (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={2} {...panelProps(tabs, tab)}>
        {tab === 'CHAT' ? (
          <>
            <MessageList
              messages={messages}
              loading={loading}
              timezone={timezone}
              emptyTitle={t('No messages yet')}
              emptyBody={t(
                'Write below to reach whoever administers tracking. They can reply from the portal.',
              )}
            />
            <MessageComposer sending={sending} onSend={send} />
          </>
        ) : (
          <MessageList
            messages={messages}
            loading={loading}
            timezone={timezone}
            emptyTitle={t('No announcements')}
            emptyBody={t(
              'Anything your workspace sends to every tracker appears here, and on your desktop.',
            )}
          />
        )}
      </Stack>
    </Stack>
  );
}
