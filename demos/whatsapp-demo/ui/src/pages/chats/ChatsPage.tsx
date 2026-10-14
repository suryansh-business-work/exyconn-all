import { useT } from '@exyconn/i18n';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { Box } from '@exyconn/shell/components/ui';
import { ChatPane } from '../../components/wa/chat/ChatPane';
import { EmptyPane } from '../../components/wa/chat/EmptyPane';
import { PushToast } from '../../components/wa/chat/PushToast';
import { relativeDay } from '../../components/wa/chat/timeline';
import { ChatListPane } from '../../components/wa/list/ChatListPane';
import { useWaFormat } from '../../hooks/useWaFormat';
import { useCompact, useWaPalette } from '../../theme/useWa';
import { WA_FONT, WA_SIZE } from '../../theme/wa.tokens';
import { useChatsPage } from './useChatsPage';

/**
 * The demo itself: WhatsApp Web's two panes on a wide screen, the phone app's list-then-chat
 * on a narrow one. Full screen, nothing of the portal around it.
 */
export function ChatsPage() {
  const t = useT();
  const c = useWaPalette();
  const compact = useCompact();
  const format = useWaFormat();
  const page = useChatsPage();
  const { demoKey, catalog, runtime, toast } = page;
  const bundle = demoKey ? catalog.bundles.get(demoKey) : undefined;
  const chat = demoKey ? runtime.store.chats[demoKey] : undefined;

  const timeLabel = (ms: number) => {
    const day = new Date(ms).setHours(0, 0, 0, 0);
    const relative = relativeDay(day, Date.now());
    if (relative === 'Today') {
      return format.time(ms);
    }
    return relative ? t(relative) : format.date(ms);
  };

  const list = (
    <ChatListPane
      bundles={catalog.bundles}
      store={runtime.store}
      activeKey={demoKey}
      userName={page.user.fullName}
      loading={catalog.loading}
      failed={Boolean(catalog.error) && catalog.bundles.size === 0}
      onRetry={() => {
        catalog
          .refetch()
          .catch((error: unknown) => portalLogger.warn('wa-demo: catalog retry failed', error));
      }}
      onOpen={page.openChat}
      timeLabel={timeLabel}
    />
  );
  const pane = bundle ? (
    <ChatPane
      key={bundle.demo.key}
      bundle={bundle}
      messages={chat?.messages ?? []}
      typing={runtime.store.typing[bundle.demo.key] ?? false}
      onSend={page.send}
      onChoose={page.choose}
      onClear={page.clear}
      onBack={page.back}
      onTrack={page.track}
    />
  ) : (
    <EmptyPane />
  );

  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        overflow: 'hidden',
        bgcolor: c.appBackdrop,
        color: c.text,
        fontFamily: WA_FONT.family,
      }}
    >
      {compact ? (
        <Box sx={{ flex: 1, minWidth: 0 }}>{bundle ? pane : list}</Box>
      ) : (
        <>
          <Box
            sx={{
              width: WA_SIZE.listWidth,
              minWidth: WA_SIZE.listMin,
              maxWidth: WA_SIZE.listMax,
              flexShrink: 0,
            }}
          >
            {list}
          </Box>
          {pane}
        </>
      )}
      <PushToast
        toast={toast}
        bundle={toast ? catalog.bundles.get(toast.demoKey) : undefined}
        onOpen={page.openChat}
        onClose={() => page.setToast(null)}
      />
    </Box>
  );
}
