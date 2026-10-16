import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Skeleton, Stack, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmEmailDirection,
  useCrmEmailThreadsQuery,
  type CrmTimelineObject,
} from '@exyconn/shell/graphql/generated';
import { ComposeEmailForm, replySubject, type ComposeEmailContext } from '../forms/compose-email';
import { EmailThreadCard, type EmailThread } from './EmailThreadCard';

interface EmailThreadsProps {
  object: CrmTimelineObject;
  id: string;
  /** Who a new email goes to by default: the record's primary address. */
  defaultTo: string[];
}

/** The Emails tab: every Gmail conversation with the record, synced when it opens. */
export function EmailThreads({ object, id, defaultTo }: Readonly<EmailThreadsProps>) {
  const t = useT();
  const kind = object === 'CONTACT' ? 'CONTACT' : 'COMPANY';
  const [compose, setCompose] = useState<ComposeEmailContext | null>(null);
  const { data, loading, error, refetch } = useCrmEmailThreadsQuery({
    variables: { object, id },
    fetchPolicy: 'cache-and-network',
  });
  const close = () => setCompose(null);

  const reply = (thread: EmailThread) => {
    const last = thread.messages.at(-1);
    const lastIn = [...thread.messages].reverse().find((m) => m.direction === CrmEmailDirection.In);
    setCompose({
      object: kind,
      id,
      to: lastIn ? [lastIn.from] : defaultTo,
      subject: replySubject(thread.subject),
      threadId: thread.threadId,
      inReplyTo: last?.messageId,
    });
  };

  if (error && !data) {
    const retry = () => {
      refetch().catch((retryError: unknown) =>
        portalLogger.warn('crm: reloading emails failed', retryError),
      );
    };
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retry}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the emails.'))}
      </Alert>
    );
  }
  const threads = data?.crmEmailThreads ?? [];
  return (
    <Stack spacing={2}>
      <Button
        variant="contained"
        sx={{ alignSelf: 'flex-start' }}
        onClick={() => setCompose({ object: kind, id, to: defaultTo })}
      >
        {t('New email')}
      </Button>
      {loading && !data && <Skeleton variant="rounded" height={200} aria-busy />}
      {data && threads.length === 0 && (
        <Text color="text.secondary">{t('No emails with this record yet.')}</Text>
      )}
      {threads.map((thread) => (
        <EmailThreadCard key={thread.threadId} thread={thread} onReply={reply} />
      ))}
      <CrudDialog
        open={compose !== null}
        title={compose?.threadId ? t('Reply') : t('New email')}
        onClose={close}
      >
        {compose && <ComposeEmailForm context={compose} onDone={close} onCancel={close} />}
      </CrudDialog>
    </Stack>
  );
}
