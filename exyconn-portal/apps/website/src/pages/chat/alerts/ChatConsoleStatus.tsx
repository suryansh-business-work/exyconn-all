import { useT } from '@exyconn/i18n';
import { Chip, Flex } from '@exyconn/shell/components/ui';
import { useChatConsole } from '../chat.context';
import type { ChatConnection } from '../socket/chatSocket.types';
import { ChatAlertSettings } from './ChatAlertSettings';

const CONNECTION_COPY: Record<
  ChatConnection,
  { label: string; color: 'success' | 'default' | 'warning' }
> = {
  ready: { label: 'Live', color: 'success' },
  connecting: { label: 'Connecting…', color: 'default' },
  offline: { label: 'Offline — reconnecting', color: 'warning' },
};

/** Whether the console is receiving chats live, next to the "notify me" settings. */
export function ChatConsoleStatus() {
  const t = useT();
  const { connection } = useChatConsole();
  const copy = CONNECTION_COPY[connection];

  return (
    <Flex direction="row" spacing={1} alignItems="center">
      <Chip
        size="small"
        variant="outlined"
        color={copy.color}
        label={t(copy.label)}
        role="status"
      />
      <ChatAlertSettings />
    </Flex>
  );
}
