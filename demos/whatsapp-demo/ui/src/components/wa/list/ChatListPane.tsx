import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Button, Skeleton } from '@exyconn/shell/components/ui';
import type { ChatStore } from '../../../runtime/store';
import type { CatalogBundle } from '../../../runtime/types';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_LINE, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { ChatListHeader } from './ChatListHeader';
import { ChatListItem } from './ChatListItem';
import { ChatSearch, type ChatFilter } from './ChatSearch';

interface ChatListPaneProps {
  bundles: ReadonlyMap<string, CatalogBundle>;
  store: ChatStore;
  activeKey?: string;
  userName: string;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onOpen: (demoKey: string) => void;
  timeLabel: (ms: number) => string;
}

const SKELETON_ROWS = ['a', 'b', 'c', 'd', 'e', 'f'];

/** The left pane (or the whole phone screen): header, search, filters and the business chats. */
export function ChatListPane(props: Readonly<ChatListPaneProps>) {
  const { bundles, store, activeKey, userName, loading, failed, onRetry, onOpen, timeLabel } =
    props;
  const t = useT();
  const c = useWaPalette();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ChatFilter>('all');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...bundles.values()]
      .filter(
        (b) =>
          !needle || `${b.demo.business.name} ${b.demo.industry}`.toLowerCase().includes(needle),
      )
      .filter((b) => filter === 'all' || (store.chats[b.demo.key]?.unread ?? 0) > 0)
      .map((b) => ({ bundle: b, last: store.chats[b.demo.key]?.messages.at(-1) }))
      .sort(
        (a, b) =>
          (b.last?.at ?? 0) - (a.last?.at ?? 0) || a.bundle.demo.order - b.bundle.demo.order,
      );
  }, [bundles, filter, query, store.chats]);

  let body = (
    <Box role="list" aria-label={t('Chats')}>
      {rows.map(({ bundle, last }) => (
        <Box role="listitem" key={bundle.demo.key}>
          <ChatListItem
            bundle={bundle}
            last={last}
            unread={store.chats[bundle.demo.key]?.unread ?? 0}
            typing={store.typing[bundle.demo.key] ?? false}
            selected={bundle.demo.key === activeKey}
            timeLabel={last ? timeLabel(last.at) : ''}
            onOpen={onOpen}
          />
        </Box>
      ))}
      {rows.length === 0 ? (
        <Box
          sx={{
            p: WA_SPACE.xl,
            textAlign: 'center',
            color: c.textMuted,
            fontSize: WA_FONT.preview,
          }}
        >
          {filter === 'unread' ? t('No unread chats') : t('No chats match your search')}
        </Box>
      ) : null}
    </Box>
  );
  if (loading) {
    body = (
      <Box aria-busy>
        {SKELETON_ROWS.map((id) => (
          <Box
            key={id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: WA_SPACE.md,
              px: WA_SPACE.md,
              height: WA_SIZE.row,
            }}
          >
            <Skeleton variant="circular" width={WA_SIZE.avatar} height={WA_SIZE.avatar} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="60%" />
              <Skeleton width="85%" />
            </Box>
          </Box>
        ))}
      </Box>
    );
  } else if (failed) {
    body = (
      <Box role="alert" sx={{ p: WA_SPACE.xl, textAlign: 'center', color: c.textMuted }}>
        <Box sx={{ mb: WA_SPACE.md }}>{t('Could not load the demo businesses.')}</Box>
        <Button variant="outlined" onClick={onRetry}>
          {t('Try again')}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      component="nav"
      aria-label={t('Chat list')}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        bgcolor: c.panel,
        borderRight: `${WA_LINE.hair} solid ${c.divider}`,
      }}
    >
      <ChatListHeader userName={userName} />
      <ChatSearch query={query} onQuery={setQuery} filter={filter} onFilter={setFilter} />
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{body}</Box>
    </Box>
  );
}
