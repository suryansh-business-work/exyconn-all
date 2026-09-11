import type { ReactElement } from 'react';
import { useState } from 'react';
import { Alert, Stack, Tab, Tabs, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import type { TrackerMessageKind } from '@shared/types';
import MessageComposer from '../components/MessageComposer';
import MessageList from '../components/MessageList';
import useMessages from '../hooks/useMessages';

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
  const [tab, setTab] = useState<TrackerMessageKind>('CHAT');
  const { messages, loading, error, sending, send } = useMessages(tab);

  return (
    <Stack spacing={2}>
      <Stack spacing={0.25}>
        <Typography variant="h6">Messages</Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          Between you and whoever administers tracking in your workspace.
        </Typography>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_event, next: TrackerMessageKind) => setTab(next)}
        variant="fullWidth"
        aria-label="Message view"
      >
        <Tab value="CHAT" label="Chat" />
        <Tab value="NOTICE" label="Announcements" />
      </Tabs>

      {error !== null ? (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
          {error}
        </Alert>
      ) : null}

      {tab === 'CHAT' ? (
        <>
          <MessageList
            messages={messages}
            loading={loading}
            timezone={timezone}
            emptyTitle="No messages yet"
            emptyBody="Write below to reach whoever administers tracking. They can reply from the portal."
          />
          <MessageComposer sending={sending} onSend={send} />
        </>
      ) : (
        <MessageList
          messages={messages}
          loading={loading}
          timezone={timezone}
          emptyTitle="No announcements"
          emptyBody="Anything your workspace sends to every tracker appears here, and on your desktop."
        />
      )}
    </Stack>
  );
}
