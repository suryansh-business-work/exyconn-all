import { useT } from '@exyconn/i18n';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Box, Button, Flex, Text, enterAnimation } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { WebsiteChatSender } from '@exyconn/shell/graphql/generated';
import type { ChatMessage } from '../socket/chatSocket.types';
import { BotMessageDetails } from './BotMessageDetails';
import { MessageAttachments } from './MessageAttachments';

/** Where a reply is: on its way, refused by the server, or delivered (from the server). */
export type DeliveryState = 'sending' | 'failed' | 'delivered';

interface MessageBubbleProps {
  message: ChatMessage;
  delivery: DeliveryState;
  /** Fades the bubble in — new messages only, and only when this browser wants animation. */
  animate: boolean;
  onDismiss?: () => void;
}

type BubbleSender = Exclude<WebsiteChatSender, WebsiteChatSender.System>;

/** Visitors on the left, the team on the right, the bot on the left with an outline. */
const BUBBLE: Record<BubbleSender, { align: 'flex-start' | 'flex-end'; sx: object }> = {
  [WebsiteChatSender.Visitor]: {
    align: 'flex-start',
    sx: { bgcolor: 'action.hover', color: 'text.primary' },
  },
  [WebsiteChatSender.Agent]: {
    align: 'flex-end',
    sx: { bgcolor: 'primary.main', color: 'primary.contrastText' },
  },
  [WebsiteChatSender.Bot]: {
    align: 'flex-start',
    sx: { bgcolor: 'background.paper', color: 'text.primary', border: 1, borderColor: 'info.main' },
  },
};

/** Under a team reply: sending, not sent (with a way to clear it), seen or sent. */
function DeliveryNote({
  message,
  delivery,
  onDismiss,
}: Readonly<Pick<MessageBubbleProps, 'message' | 'delivery' | 'onDismiss'>>) {
  const t = useT();
  if (delivery === 'failed') {
    return (
      <Flex direction="row" spacing={1} alignItems="center">
        <Text size="caption" color="error">
          {t('Not sent')}
        </Text>
        {onDismiss && (
          <Button size="small" color="error" onClick={onDismiss}>
            {t('Dismiss')}
          </Button>
        )}
      </Flex>
    );
  }
  if (delivery === 'sending') {
    return (
      <Text size="caption" color="text.secondary">
        {t('Sending…')}
      </Text>
    );
  }
  return (
    <Text size="caption" color="text.secondary">
      {message.readAt ? t('Seen') : t('Sent')}
    </Text>
  );
}

/** One message of a thread; system notices sit centred without a bubble. */
export function MessageBubble({
  message,
  delivery,
  animate,
  onDismiss,
}: Readonly<MessageBubbleProps>) {
  const { formatTime } = useSettings();
  const enter = animate ? { animation: enterAnimation.item } : {};
  const time = formatTime(message.createdAt);

  if (message.sender === WebsiteChatSender.System) {
    return (
      <Box role="note" sx={[{ textAlign: 'center', px: 2, py: 0.5 }, enter]}>
        <Text size="caption" color="text.secondary">
          {message.body} · {time}
        </Text>
      </Box>
    );
  }

  const style = BUBBLE[message.sender];
  const isAgent = message.sender === WebsiteChatSender.Agent;
  return (
    <Flex direction="column" alignItems={style.align} sx={[{ maxWidth: '100%' }, enter]}>
      <Flex direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
        {message.sender === WebsiteChatSender.Bot && (
          <SmartToyIcon fontSize="inherit" color="info" />
        )}
        <Text size="caption" color="text.secondary">
          {message.senderName} · {time}
        </Text>
      </Flex>
      <Box
        sx={[
          { px: 1.5, py: 1, borderRadius: 1, maxWidth: { xs: '90%', md: '70%' } },
          style.sx,
          delivery === 'failed' && { opacity: 0.6 },
        ]}
      >
        {message.body && (
          <Text size="sm" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {message.body}
          </Text>
        )}
        <MessageAttachments attachments={message.attachments} />
      </Box>
      {message.sender === WebsiteChatSender.Bot && <BotMessageDetails message={message} />}
      {isAgent && <DeliveryNote message={message} delivery={delivery} onDismiss={onDismiss} />}
    </Flex>
  );
}
