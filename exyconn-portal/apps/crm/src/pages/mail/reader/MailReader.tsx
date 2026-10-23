import { useEffect, useRef, useState } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, Box, Button, Stack } from '@exyconn/shell/components/ui';
import { CrmMailAction, useCrmMailThreadQuery } from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { ComposeEmailContext } from '../../../records/detail/forms/compose-email';
import { composeFor, senderOf, type ReplyMode } from '../mailCompose';
import { useMailActions } from '../useMailActions';
import type { OpenThread } from '../useMailRoute';
import { ReaderHeader } from './ReaderHeader';
import { ReaderPreview } from './ReaderPreview';
import { MailMessageItem } from './MailMessageItem';
import { ReplyArea } from './ReplyArea';

interface MailReaderProps {
  open: OpenThread;
  onClose: () => void;
}

/** Actions after which the conversation leaves the view it was opened from. */
const CLOSING: ReadonlySet<CrmMailAction> = new Set([
  CrmMailAction.Archive,
  CrmMailAction.Trash,
  CrmMailAction.MarkUnread,
]);

const logFailure = (error: unknown) => portalLogger.warn('crm: mail reader action failed', error);

/**
 * The open conversation, read from Gmail: every message (the newest open), its attachments,
 * and Reply, Reply all and Forward. Opening an unread conversation marks it read, as Gmail does.
 */
export function MailReader({ open, onClose }: Readonly<MailReaderProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const { data, error, refetch } = useCrmMailThreadQuery({
    variables: open,
    fetchPolicy: 'cache-and-network',
  });
  const { run, busy } = useMailActions();
  const [compose, setCompose] = useState<ComposeEmailContext | null>(null);
  const marked = useRef('');
  const thread = data?.crmMailThread;

  useEffect(() => {
    if (thread?.unread && marked.current !== thread.id) {
      marked.current = thread.id;
      run([open], CrmMailAction.MarkRead, true).catch(logFailure);
    }
  }, [thread, open, run]);

  if (error && !data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onClose}>
            {t('Back to the list')}
          </Button>
        }
      >
        {errorMessage(error, t('The conversation could not be opened.'))}
      </Alert>
    );
  }
  if (!thread) {
    return <ReaderPreview open={open} onBack={onClose} />;
  }

  const onAction = async (action: CrmMailAction) => {
    const done = await run([open], action);
    if (done && CLOSING.has(action)) {
      onClose();
    } else if (done) {
      await refetch();
    }
  };
  const last = thread.messages.at(-1);
  const start = (mode: ReplyMode) => {
    if (!last) {
      return;
    }
    const when = formatDateTime(last.sentAt);
    const sender = senderOf(last);
    setCompose(
      composeFor(thread, last, mode, {
        wrote: t('On {when}, {sender} wrote:', { when, sender }),
        forwarded: [
          t('---------- Forwarded message ----------'),
          t('From: {sender}', { sender }),
          t('Date: {when}', { when }),
          t('Subject: {subject}', { subject: last.subject }),
          t('To: {list}', { list: last.to.join(', ') }),
        ].join('\n'),
      }),
    );
  };
  const sent = () => {
    setCompose(null);
    refetch().catch(logFailure);
  };

  return (
    <Stack spacing={2}>
      <ReaderHeader
        thread={thread}
        busy={busy}
        onBack={onClose}
        onAction={(action) => {
          onAction(action).catch(logFailure);
        }}
      />
      <Box component="ol" sx={{ p: 0, m: 0 }} aria-label={t('Messages')}>
        {thread.messages.map((message, index) => (
          <MailMessageItem
            key={message.id}
            accountId={thread.accountId}
            message={message}
            defaultOpen={index === thread.messages.length - 1 || message.unread}
          />
        ))}
      </Box>
      <ReplyArea
        compose={compose}
        canReplyAll={(last?.to.length ?? 0) + (last?.cc.length ?? 0) > 1}
        onStart={start}
        onSent={sent}
        onCancel={() => setCompose(null)}
      />
    </Stack>
  );
}
