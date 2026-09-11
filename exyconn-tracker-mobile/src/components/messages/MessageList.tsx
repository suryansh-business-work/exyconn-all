import { useRef } from 'react';
import { FlatList } from 'react-native';
import { YStack } from 'tamagui';
import type { TrackerMessage } from '@exyconn/tracker-core';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { Surface } from '../ui/Surface';
import { Body, Heading } from '../ui/Typography';
import { MessageBubble } from './MessageBubble';

const SKELETON_ROWS = ['s1', 's2', 's3'] as const;
const SKELETON_HEIGHT = 48;

interface Props {
  messages: readonly TrackerMessage[];
  loading: boolean;
  timezone: string;
  /** What an empty thread should say — it differs between a conversation and an inbox. */
  emptyTitle: string;
  emptyBody: string;
}

/** Placeholder rows while the thread is read, so the screen does not jump when it lands. */
function ThreadSkeleton() {
  return (
    <YStack padding="$4" gap="$3" accessibilityLabel="Loading messages" accessible>
      {SKELETON_ROWS.map((id) => (
        <YStack
          key={id}
          height={SKELETON_HEIGHT}
          borderRadius={TRACKER_RADIUS}
          backgroundColor="$hairline"
        />
      ))}
    </YStack>
  );
}

/**
 * The thread itself, oldest at the top, scrolled to the newest.
 *
 * A conversation that opened at the top would show whatever was said first — which, on a
 * thread months old, is the least useful line in it.
 */
export function MessageList({
  messages,
  loading,
  timezone,
  emptyTitle,
  emptyBody,
}: Readonly<Props>) {
  const list = useRef<FlatList<TrackerMessage>>(null);

  if (loading) {
    return <ThreadSkeleton />;
  }

  if (messages.length === 0) {
    return (
      <YStack padding="$4">
        <Surface alignItems="center" padding="$5" gap="$1">
          <Heading textAlign="center">{emptyTitle}</Heading>
          <Body color="$muted" textAlign="center">
            {emptyBody}
          </Body>
        </Surface>
      </YStack>
    );
  }

  return (
    <FlatList
      ref={list}
      data={messages}
      keyExtractor={(message) => message.id}
      renderItem={({ item }) => <MessageBubble message={item} timezone={timezone} />}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
    />
  );
}
