import { useT } from '@exyconn/i18n';
import MarkChatUnreadIcon from '@mui/icons-material/MarkChatUnread';
import { Box, Chip, Flex, duration, easing, keyframes } from '@exyconn/shell/components/ui';
import { ChatConsoleStatus } from '../alerts/ChatConsoleStatus';
import type { ChatArrival } from './useLiveChatList';
import { ChatSessionFilters } from './ChatSessionFilters';
import type { ChatSessionFilterState } from './chat-sessions.filters';

const pulse = keyframes`
  0% { transform: scale(0.9); opacity: 0; }
  40% { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

interface ChatSessionsToolbarProps {
  filters: ChatSessionFilterState;
  onFiltersChange: (next: ChatSessionFilterState) => void;
  arrival: ChatArrival | null;
}

/** Above the chat list: connection state, the notify-me settings, a new-message notice and filters. */
export function ChatSessionsToolbar({
  filters,
  onFiltersChange,
  arrival,
}: Readonly<ChatSessionsToolbarProps>) {
  const t = useT();

  return (
    <Box>
      <Flex
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Box aria-live="polite" sx={{ minHeight: 32 }}>
          {arrival && (
            <Chip
              key={arrival.id}
              color="primary"
              icon={<MarkChatUnreadIcon />}
              label={t('New message from {name}', { name: arrival.name })}
              sx={{ animation: `${pulse} ${duration.slow}ms ${easing.standard}` }}
            />
          )}
        </Box>
        <ChatConsoleStatus />
      </Flex>
      <ChatSessionFilters value={filters} onChange={onFiltersChange} />
    </Box>
  );
}
