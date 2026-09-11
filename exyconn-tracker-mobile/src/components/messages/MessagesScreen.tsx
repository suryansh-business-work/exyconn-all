import { useContext, useState } from 'react';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import type { TrackerMessageKind } from '@exyconn/tracker-core';
import { MessageForm } from '../../forms/message';
import { useMessages } from '../../hooks/useMessages';
import { Notice } from '../ui/Notice';
import { Caption } from '../ui/Typography';
import { ChatKeyboardView } from './ChatKeyboardView';
import { MessageList } from './MessageList';
import { SegmentedControl, type SegmentOption } from '../ui/SegmentedControl';

const TABS: readonly SegmentOption<TrackerMessageKind>[] = [
  { value: 'CHAT', label: 'Chat' },
  { value: 'NOTICE', label: 'Announcements' },
];

/** What each view says when it is empty — a conversation and an inbox are not the same. */
const EMPTY: Readonly<Record<TrackerMessageKind, { title: string; body: string }>> = {
  CHAT: {
    title: 'No messages yet',
    body: 'Write below to reach whoever administers tracking. They can reply from the portal.',
  },
  NOTICE: {
    title: 'No announcements',
    body: 'Anything your workspace sends to every tracker appears here, and as a notification on this phone.',
  },
};

/** Space under the composer on a phone without a home indicator to clear. */
const COMPOSER_GAP = 12;

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
 * Announcements are read-only here — they arrive as notifications while the app is in the
 * background, and this is where they can be found again afterwards.
 */
export function MessagesScreen({ timezone }: Readonly<Props>) {
  const [tab, setTab] = useState<TrackerMessageKind>('CHAT');
  const { messages, loading, error, send } = useMessages(tab);
  const empty = EMPTY[tab];
  const insets = useSafeAreaInsets();
  // The tab bar floats over the foot of the screen; the composer and the list sit above it.
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const foot = tabBarHeight > 0 ? tabBarHeight : Math.max(insets.bottom, COMPOSER_GAP);

  return (
    <ChatKeyboardView>
      <YStack flex={1}>
        <YStack paddingHorizontal="$4" paddingTop="$3" gap="$2">
          <Caption>Between you and whoever administers tracking in your workspace.</Caption>
          <SegmentedControl
            options={TABS}
            value={tab}
            onChange={setTab}
            label="Message view"
            full
          />
          {error === null ? null : <Notice severity="error">{error}</Notice>}
        </YStack>
        <YStack flex={1}>
          <MessageList
            messages={messages}
            loading={loading}
            timezone={timezone}
            emptyTitle={empty.title}
            emptyBody={empty.body}
          />
        </YStack>
        {tab === 'CHAT' ? (
          <YStack
            padding="$3"
            paddingBottom={foot}
            borderTopWidth={1}
            borderTopColor="$hairline"
            backgroundColor="$paper"
          >
            <MessageForm onSend={send} />
          </YStack>
        ) : (
          <YStack height={foot} />
        )}
      </YStack>
    </ChatKeyboardView>
  );
}
