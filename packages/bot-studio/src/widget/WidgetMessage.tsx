import { memo } from 'react';
import type { BotContent, ChatMessage } from '@exyconn/wa-flow';
import { Box, Chip, Typography } from '@exyconn/shell/components/ui';
import { FormattedText } from '../shared/FormattedText';
import { Bubble } from './parts/Bubble';
import { DocumentCard } from './parts/DocumentCard';
import { ContactCard, CtaActions, LocationCard } from './parts/InfoCards';
import { OptionButtons, OptionList } from './parts/OptionButtons';
import { OrderCard } from './parts/OrderCard';
import { ProductCard, ProductCarousel } from './parts/ProductCards';
import { TicketCard } from './parts/TicketCard';
import { WidgetIllustration } from './parts/WidgetIllustration';

/** Header, text and footer of an interactive message. */
function Framed({
  header,
  text,
  footer,
}: Readonly<{ header?: string; text: string; footer?: string }>) {
  return (
    <>
      {header && (
        <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700, mb: 0.5 }}>
          {header}
        </Typography>
      )}
      <FormattedText text={text} />
      {footer && (
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {footer}
        </Typography>
      )}
    </>
  );
}

/** Content that sits inside a bubble. */
function BubbleBody({ content }: Readonly<{ content: BotContent }>) {
  switch (content.type) {
    case 'text':
      return <FormattedText text={content.text} />;
    case 'buttons':
      return (
        <>
          <Framed {...content} />
          <OptionButtons options={content.buttons} quoted={content.text} />
        </>
      );
    case 'list':
      return (
        <>
          <Framed {...content} />
          <OptionList caption={content.button} sections={content.sections} quoted={content.text} />
        </>
      );
    case 'cta':
      return (
        <>
          <Framed {...content} />
          <CtaActions actions={content.actions} />
        </>
      );
    default:
      return null;
  }
}

/** Content drawn as a card instead of a bubble. */
function CardBody({ content }: Readonly<{ content: BotContent }>) {
  switch (content.type) {
    case 'image':
      return (
        <Box
          sx={{
            width: '100%',
            borderRadius: 1,
            overflow: 'hidden',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <WidgetIllustration image={content.image} height={120} />
          {content.caption && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'background.paper',
                fontSize: 'body2.fontSize',
                whiteSpace: 'pre-wrap',
              }}
            >
              <FormattedText text={content.caption} />
            </Box>
          )}
        </Box>
      );
    case 'document':
      return <DocumentCard document={content.document} caption={content.caption} />;
    case 'location':
      return <LocationCard location={content.location} caption={content.caption} />;
    case 'contact':
      return <ContactCard contact={content.contact} />;
    case 'product':
      return <ProductCard product={content.product} option={content.option} />;
    case 'carousel':
      return <ProductCarousel text={content.text} cards={content.cards} />;
    case 'ticket':
      return <TicketCard ticket={content.ticket} caption={content.caption} />;
    case 'order':
      return <OrderCard order={content.order} pay={content.pay} />;
    default:
      return null;
  }
}

const BUBBLE_TYPES: ReadonlySet<BotContent['type']> = new Set(['text', 'buttons', 'list', 'cta']);

/** One row of the widget's conversation. */
export const WidgetMessage = memo(function WidgetMessage({
  message,
  time,
}: Readonly<{ message: ChatMessage; time: string }>) {
  const { content } = message;
  if (content.type === 'system') {
    return (
      <Chip
        size="small"
        label={content.text}
        sx={{
          alignSelf: 'center',
          height: 'auto',
          py: 0.5,
          '& .MuiChip-label': { whiteSpace: 'normal' },
        }}
      />
    );
  }
  if (content.type === 'reply' || message.from === 'user') {
    return (
      <Bubble mine time={time}>
        {'text' in content ? content.text : ''}
      </Bubble>
    );
  }
  const sender = 'sender' in content ? content.sender : undefined;
  const bare = !BUBBLE_TYPES.has(content.type);
  return (
    <Bubble mine={false} time={time} sender={sender} bare={bare}>
      {bare ? <CardBody content={content} /> : <BubbleBody content={content} />}
    </Bubble>
  );
});
