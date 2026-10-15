import { useEffect, useRef } from 'react';
import { useT } from '@exyconn/i18n';
import type { ChatMessage } from '@exyconn/wa-flow';
import { Box, Typography } from '@exyconn/shell/components/ui';
import { useWaFormat } from '../runtime/useWaFormat';
import { WidgetMessage } from './WidgetMessage';

interface WidgetConversationProps {
  messages: readonly ChatMessage[];
  typing: boolean;
}

/** The scrolling conversation, kept at its newest message, with the agent's typing dots. */
export function WidgetConversation({ messages, typing }: Readonly<WidgetConversationProps>) {
  const t = useT();
  const format = useWaFormat();
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, typing]);

  return (
    // The scroll container takes focus so keyboard users can scroll it; the log inside it is
    // what screen readers follow.
    <Box
      role="region"
      aria-label={t('Conversation')}
      tabIndex={0}
      sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'background.default' }}
    >
      <Box
        role="log"
        aria-live="polite"
        sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5 }}
      >
        {messages.map((message) => (
          <WidgetMessage key={message.id} message={message} time={format.time(message.at)} />
        ))}
        {typing && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {t('Typing…')}
          </Typography>
        )}
        <Box ref={end} />
      </Box>
    </Box>
  );
}
