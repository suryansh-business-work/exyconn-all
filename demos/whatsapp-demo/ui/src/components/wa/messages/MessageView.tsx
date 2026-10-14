import { memo, useMemo } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import type { BotContent, ChatMessage, UserContent } from '@exyconn/wa-flow';
import { useCompact } from '../../../theme/useWa';
import { WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { ContactMessage } from './ContactMessage';
import { CtaMessage } from './CtaMessage';
import { DocumentMessage } from './DocumentMessage';
import { LocationMessage } from './LocationMessage';
import { OrderMessage } from './OrderMessage';
import { CarouselMessage, ProductMessage } from './ProductMessages';
import {
  ButtonsMessage,
  ImageMessage,
  ListMessage,
  SystemNotice,
  TextMessage,
} from './SimpleMessages';
import { TicketMessage } from './TicketMessage';
import type { Frame } from './types';
import { UserMessage } from './UserMessage';

function BotBody({ content, frame }: Readonly<{ content: BotContent; frame: Frame }>) {
  switch (content.type) {
    case 'text':
      return <TextMessage content={content} frame={frame} />;
    case 'buttons':
      return <ButtonsMessage content={content} frame={frame} />;
    case 'list':
      return <ListMessage content={content} frame={frame} />;
    case 'cta':
      return <CtaMessage content={content} frame={frame} />;
    case 'image':
      return <ImageMessage content={content} frame={frame} />;
    case 'document':
      return <DocumentMessage content={content} frame={frame} />;
    case 'location':
      return <LocationMessage content={content} frame={frame} />;
    case 'contact':
      return <ContactMessage content={content} frame={frame} />;
    case 'product':
      return <ProductMessage content={content} frame={frame} />;
    case 'carousel':
      return <CarouselMessage content={content} frame={frame} />;
    case 'ticket':
      return <TicketMessage content={content} frame={frame} />;
    case 'order':
      return <OrderMessage content={content} frame={frame} />;
    default:
      return null;
  }
}

interface MessageViewProps {
  message: ChatMessage;
  tail: boolean;
  time: string;
}

/** One row of the chat: a notice in the middle, a bot message on the left, yours on the right. */
export const MessageView = memo(function MessageView({
  message,
  tail,
  time,
}: Readonly<MessageViewProps>) {
  const compact = useCompact();
  const frame = useMemo<Frame>(() => ({ tail, time }), [tail, time]);
  if (message.content.type === 'system') {
    return <SystemNotice text={message.content.text} />;
  }
  const mine = message.from === 'user';
  const wide = message.content.type === 'carousel';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: mine ? 'flex-end' : 'flex-start',
        mt: frame.tail ? WA_SPACE.md : WA_SPACE.hair,
        px: WA_SPACE.sm,
      }}
    >
      <Box
        sx={{
          maxWidth: compact || wide ? WA_SIZE.bubbleMaxCompact : WA_SIZE.bubbleMax,
          width: wide ? '100%' : undefined,
          minWidth: 0,
        }}
      >
        {mine ? (
          <UserMessage
            content={message.content as UserContent}
            status={message.status}
            frame={frame}
          />
        ) : (
          <BotBody content={message.content as BotContent} frame={frame} />
        )}
      </Box>
    </Box>
  );
});
