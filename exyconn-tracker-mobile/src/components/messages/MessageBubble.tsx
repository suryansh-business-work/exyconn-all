import { memo } from 'react';
import { YStack } from 'tamagui';
import { formatDateTime, type TrackerMessage } from '@exyconn/tracker-core';
import { useBrand } from '../../theme/BrandProvider';
import { TRACKER_RADIUS, borderWidth } from '../../theme/tokens';
import { Body, Caption } from '../ui/Typography';

/** The brand colour at 16% (hex alpha), the tint the desktop gives the employee's own lines. */
const MINE_TINT_ALPHA = '29';

interface Props {
  message: TrackerMessage;
  timezone: string;
}

/** The workspace's author, named as they were at the time — or the workspace, for a departed one. */
function authorOf(message: TrackerMessage): string {
  return message.authorName || 'Your workspace';
}

/**
 * One line of the conversation.
 *
 * The employee's own messages sit on the right in the brand colour, the workspace's on the
 * left — the one arrangement every chat anybody has used already means "mine" and "theirs",
 * so the side does the work and nothing has to be labelled "You". A screen reader cannot see
 * the side, so it is the one place the author is spoken for the employee's own lines too.
 */
function MessageBubbleView({ message, timezone }: Readonly<Props>) {
  const brand = useBrand();
  const mine = message.direction === 'TO_ADMIN';
  const when = formatDateTime(message.createdAt, timezone);
  // Who wrote it only when it was not the person reading it — "You, 10:42" is a line of noise
  // on every message somebody sends.
  const meta = mine ? when : `${authorOf(message)} · ${when}`;
  const spoken = `${mine ? 'You' : authorOf(message)}, ${when}. ${message.title} ${message.body}`;

  return (
    <YStack
      alignItems={mine ? 'flex-end' : 'flex-start'}
      gap="$1"
      accessible
      accessibilityLabel={spoken}
    >
      <YStack
        maxWidth="85%"
        paddingHorizontal="$3"
        paddingVertical="$2"
        gap="$1"
        borderRadius={TRACKER_RADIUS}
        borderWidth={borderWidth.hairline}
        borderColor="$hairline"
        backgroundColor={mine ? `${brand.primary}${MINE_TINT_ALPHA}` : '$paper'}
      >
        {message.title === '' ? null : <Body fontWeight="600">{message.title}</Body>}
        <Body>{message.body}</Body>
      </YStack>
      <Caption>{meta}</Caption>
    </YStack>
  );
}

export const MessageBubble = memo(MessageBubbleView);
