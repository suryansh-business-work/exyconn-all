import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { ChatMessage, DocumentAttachment, RenderedOption, Ticket } from '@exyconn/wa-flow';
import type { UiSignal } from '../../../analytics/useDemoAnalytics';
import type { CatalogBundle } from '../../../runtime/types';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT } from '../../../theme/wa.tokens';
import { ChatActionsProvider, type ChatActions } from '../ChatActions';
import { Wallpaper } from '../common/Wallpaper';
import { BusinessInfoDrawer } from './BusinessInfoDrawer';
import { ChatHeader } from './ChatHeader';
import { DocumentDialog } from './DocumentDialog';
import { ComposerForm } from './forms/composer';
import { MessageList } from './MessageList';
import { TicketDialog } from './TicketDialog';

interface ChatPaneProps {
  bundle: CatalogBundle;
  messages: readonly ChatMessage[];
  typing: boolean;
  onSend: (text: string) => void;
  onChoose: (option: RenderedOption, quoted: string) => void;
  onClear: () => void;
  onBack: () => void;
  onTrack?: (signal: UiSignal) => void;
}

/** One open chat: header, wallpapered conversation and the message bar. */
export function ChatPane({
  bundle,
  messages,
  typing,
  onSend,
  onChoose,
  onClear,
  onBack,
  onTrack,
}: Readonly<ChatPaneProps>) {
  const t = useT();
  const c = useWaPalette();
  const notify = useNotify();
  const confirm = useConfirm();
  const [info, setInfo] = useState(false);
  const [document, setDocument] = useState<DocumentAttachment | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const demoKey = bundle.demo.key;

  const actions = useMemo<ChatActions>(
    () => ({
      choose: onChoose,
      openDocument: (doc) => {
        setDocument(doc);
        onTrack?.({ type: 'DOCUMENT_OPENED', demoKey, label: doc.fileName });
      },
      openTicket: (pass) => {
        setTicket(pass);
        onTrack?.({ type: 'QR_OPENED', demoKey, label: pass.title });
      },
      explainExternal: (target) =>
        notify('In a live setup this opens {target}', 'info', { target }),
    }),
    [demoKey, notify, onChoose, onTrack],
  );

  const clear = () => {
    confirm({
      title: 'Clear this chat?',
      message:
        'Messages, bookings and pending reminders in this chat are removed. The business greets you again.',
      confirmText: 'Clear chat',
      destructive: true,
    })
      .then((ok) => {
        if (ok) {
          onClear();
        }
      })
      .catch((error: unknown) => portalLogger.error('wa-demo: clear chat failed', error));
  };

  return (
    <ChatActionsProvider value={actions}>
      <Box
        component="main"
        aria-label={t('Chat with {name}', { name: bundle.demo.business.name })}
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          bgcolor: c.chatBackground,
          fontSize: WA_FONT.message,
        }}
      >
        <ChatHeader
          demo={bundle.demo}
          typing={typing}
          onBack={onBack}
          onInfo={() => setInfo(true)}
          onClear={clear}
        />
        <Wallpaper>
          <MessageList messages={messages} typing={typing} />
        </Wallpaper>
        <ComposerForm
          onSend={onSend}
          onUnavailable={() =>
            notify('Attachments and voice notes are not part of this demo', 'info')
          }
        />
      </Box>
      <BusinessInfoDrawer demo={bundle.demo} open={info} onClose={() => setInfo(false)} />
      <DocumentDialog document={document} onClose={() => setDocument(null)} />
      <TicketDialog ticket={ticket} onClose={() => setTicket(null)} />
    </ChatActionsProvider>
  );
}
