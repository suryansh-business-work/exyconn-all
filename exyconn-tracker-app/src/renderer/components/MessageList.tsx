import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { Skeleton, Stack, Typography } from '@exyconn/ui';
import type { TrackerMessage } from '@shared/types';
import MessageBubble from './MessageBubble';
import Surface from './Surface';

const SKELETON_ROWS = ['s1', 's2', 's3'] as const;

interface Props {
  messages: readonly TrackerMessage[];
  loading: boolean;
  timezone: string;
  /** What an empty thread should say — it differs between a conversation and an inbox. */
  emptyTitle: string;
  emptyBody: string;
}

/**
 * The thread itself, oldest at the top, scrolled to the newest.
 *
 * A conversation that opened at the top would show whatever was said first — which, on a
 * thread months old, is the least useful line in it.
 */
export default function MessageList({
  messages,
  loading,
  timezone,
  emptyTitle,
  emptyBody,
}: Readonly<Props>): ReactElement {
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  if (loading) {
    return (
      <Surface sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          {SKELETON_ROWS.map((id) => (
            <Skeleton key={id} variant="rounded" height={48} />
          ))}
        </Stack>
      </Surface>
    );
  }

  if (messages.length === 0) {
    return (
      <Surface sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="subtitle1">{emptyTitle}</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mt: 0.5,
          }}
        >
          {emptyBody}
        </Typography>
      </Surface>
    );
  }

  return (
    <Surface sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} timezone={timezone} />
        ))}
        <div ref={end} />
      </Stack>
    </Surface>
  );
}
