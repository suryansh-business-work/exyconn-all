import { useT } from '@exyconn/i18n';
import { Box, Chip, InputAdornment, TextField } from '@exyconn/shell/components/ui';
import SearchIcon from '@mui/icons-material/Search';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_RADIUS, WA_SPACE } from '../../../theme/wa.tokens';

export type ChatFilter = 'all' | 'unread';

interface ChatSearchProps {
  query: string;
  onQuery: (query: string) => void;
  filter: ChatFilter;
  onFilter: (filter: ChatFilter) => void;
}

const FILTERS: readonly { id: ChatFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

/** Search box and the All / Unread chips under the chat-list header. */
export function ChatSearch({ query, onQuery, filter, onFilter }: Readonly<ChatSearchProps>) {
  const t = useT();
  const c = useWaPalette();
  return (
    <Box sx={{ px: WA_SPACE.md, pt: WA_SPACE.sm, pb: WA_SPACE.xs, bgcolor: c.panel }}>
      <TextField
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={t('Search or start a new chat')}
        size="small"
        fullWidth
        slotProps={{
          htmlInput: { 'aria-label': t('Search chats') },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: c.textMuted }} fontSize="small" />
              </InputAdornment>
            ),
            sx: {
              borderRadius: WA_RADIUS.input,
              bgcolor: c.panelHeader,
              color: c.text,
              fontSize: WA_FONT.preview,
              '& fieldset': { border: 'none' },
            },
          },
        }}
      />
      <Box
        role="group"
        aria-label={t('Filter chats')}
        sx={{ display: 'flex', gap: WA_SPACE.sm, mt: WA_SPACE.sm }}
      >
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <Chip
              key={f.id}
              label={t(f.label)}
              clickable
              aria-pressed={active}
              onClick={() => onFilter(f.id)}
              sx={{
                bgcolor: active ? c.notice : c.panelHeader,
                color: active ? c.brand : c.textMuted,
                fontWeight: 500,
                borderRadius: WA_RADIUS.pill,
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
