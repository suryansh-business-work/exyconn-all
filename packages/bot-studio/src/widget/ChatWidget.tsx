import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import type { DocumentAttachment } from '@exyconn/wa-flow';
import { Paper, Typography } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import type { WidgetChat } from './useWidgetChat';
import { useWidgetLook } from './widget.look';
import { WidgetActionsProvider, type WidgetActions } from './WidgetActions';
import { WidgetHeader } from './WidgetHeader';
import { WidgetConversation } from './WidgetConversation';
import { DocumentDialog } from './parts/DocumentDialog';
import { WidgetComposerForm } from './forms/widget-composer';

interface ChatWidgetProps {
  chat: WidgetChat & { bundle: NonNullable<WidgetChat['bundle']> };
  /** Fixed height of the panel; it fills its parent when left out. */
  height?: number | string;
  onClose?: () => void;
}

/**
 * The website chat widget: the panel a client's visitors open from the corner of their site.
 * It draws any conversation the shared runtime plays — bubbles, quick replies, product cards,
 * orders, tickets and documents — in the business's own colour.
 */
export function ChatWidget({ chat, height = '100%', onClose }: Readonly<ChatWidgetProps>) {
  const t = useT();
  const notify = useNotify();
  const { demo } = chat.bundle;
  const look = useWidgetLook(demo.business.accent);
  const [document, setDocument] = useState<DocumentAttachment | null>(null);

  const actions = useMemo<WidgetActions>(
    () => ({
      choose: chat.choose,
      openDocument: setDocument,
      followAction: ({ kind, target }) =>
        notify(
          kind === 'call'
            ? t('On your website this button calls {target}.', { target })
            : t('On your website this button opens {target}.', { target }),
          'info',
        ),
      look,
    }),
    [chat.choose, look, notify, t],
  );

  return (
    <WidgetActionsProvider value={actions}>
      <Paper
        elevation={8}
        role="region"
        aria-label={t('Chat with {name}', { name: demo.business.name })}
        sx={{ height, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
      >
        <WidgetHeader demo={demo} look={look} onRestart={chat.restart} onClose={onClose} />
        <WidgetConversation messages={chat.messages} typing={chat.typing} />
        <WidgetComposerForm onSend={chat.send} placeholder={t('Ask anything, or pick an option')} />
        <Typography
          variant="caption"
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            py: 0.5,
            bgcolor: 'background.paper',
          }}
        >
          {t('AI agent by Exyconn')}
        </Typography>
      </Paper>
      <DocumentDialog document={document} onClose={() => setDocument(null)} />
    </WidgetActionsProvider>
  );
}
