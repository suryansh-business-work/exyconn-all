import { useEffect, useRef, type ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import type { ChatMessage } from '../socket/chatSocket.types';
import type { PendingMessage } from './conversation.messages';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageThreadProps {
  /** Names the scrolling message log for screen readers, e.g. "Chat with us". */
  label: string;
  messages: ChatMessage[];
  pending: PendingMessage[];
  /** Ids of messages that arrived while the page was open — the ones that animate in. */
  freshIds: ReadonlySet<string>;
  animate: boolean;
  typingName: string | null;
  onDismiss: (clientId: string) => void;
  /** The reply box under the thread (the live thread only). */
  composer?: ReactNode;
}

const prefersReducedMotion = () =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** One thread of the chat, oldest at the top; the page keeps the newest message in view. */
export function MessageThread({
  label,
  messages,
  pending,
  freshIds,
  animate,
  typingName,
  onDismiss,
  composer,
}: Readonly<MessageThreadProps>) {
  const t = useT();
  const end = useRef<HTMLDivElement>(null);
  const count = messages.length + pending.length;

  useEffect(() => {
    end.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [count, typingName]);

  return (
    <Box sx={glass}>
      {/* The page scrolls, not this box, so the thread needs no focusable scroll region; the
          reply box stays pinned to the bottom of the screen while the messages scroll past. */}
      <Box role="log" aria-live="polite" aria-label={t(label)} sx={{ p: 2 }}>
        <Flex direction="column" spacing={1.5}>
          {count === 0 && (
            <Text size="sm" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {t('No messages in this thread yet.')}
            </Text>
          )}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              delivery="delivered"
              animate={animate && freshIds.has(message.id)}
            />
          ))}
          {pending.map((item) => (
            <MessageBubble
              key={item.clientId}
              message={item.message}
              delivery={item.failed ? 'failed' : 'sending'}
              animate={animate}
              onDismiss={() => onDismiss(item.clientId)}
            />
          ))}
          {typingName && <TypingIndicator name={typingName} />}
        </Flex>
      </Box>
      {composer && (
        <Box sx={{ position: 'sticky', bottom: 0, zIndex: 1, bgcolor: 'background.paper' }}>
          {composer}
        </Box>
      )}
      <Box ref={end} />
    </Box>
  );
}
