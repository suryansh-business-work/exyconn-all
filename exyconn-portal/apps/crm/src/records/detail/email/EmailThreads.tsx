import { useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex, Stack } from '@exyconn/shell/components/ui';
import { ListSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmEmailDirection,
  useCrmEmailThreadsQuery,
  type CrmTimelineObject,
} from '@exyconn/shell/graphql/generated';
import { ComposeEmailForm, replySubject, type ComposeEmailContext } from '../forms/compose-email';
import { EmailThreadCard, type EmailThread } from './EmailThreadCard';
import { ReconnectNotice } from './ReconnectNotice';

interface EmailThreadsProps {
  object: CrmTimelineObject;
  id: string;
  /** Who a new email goes to by default: the record's primary address. */
  defaultTo: string[];
}

const logFailure = (error: unknown) => portalLogger.warn('crm: reloading emails failed', error);

/**
 * The Emails tab: every Gmail conversation with the record across the CRM's enabled accounts,
 * newest first, synced from Gmail when it opens and on Refresh.
 */
export function EmailThreads({ object, id, defaultTo }: Readonly<EmailThreadsProps>) {
  const t = useT();
  const kind = object === 'CONTACT' ? 'CONTACT' : 'COMPANY';
  const [compose, setCompose] = useState<ComposeEmailContext | null>(null);
  const { data, loading, error, refetch } = useCrmEmailThreadsQuery({
    variables: { object, id },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
  const close = () => setCompose(null);
  const refresh = () => {
    refetch().catch(logFailure);
  };

  const reply = (thread: EmailThread) => {
    const last = thread.messages.at(-1);
    const lastIn = thread.messages.findLast((m) => m.direction === CrmEmailDirection.In);
    setCompose({
      object: kind,
      id,
      to: lastIn ? [lastIn.from] : defaultTo,
      subject: replySubject(thread.subject),
      threadId: thread.threadId,
      inReplyTo: last?.messageId,
      fromAccountId: thread.accountId || undefined,
    });
  };

  const threads = data?.crmEmailThreads ?? [];
  let body;
  if (error && !data) {
    body = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={refresh}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the emails.'))}
      </Alert>
    );
  } else if (!data) {
    body = <ListSkeleton toolbar={false} rows={3} columns={3} label="Loading the emails" />;
  } else if (threads.length === 0) {
    body = (
      <EmptyState
        title="No emails with this record yet"
        description="Emails to and from its addresses in the connected Gmail accounts show here."
      />
    );
  } else {
    body = threads.map((thread, position) => (
      <EmailThreadCard
        key={`${thread.accountId}:${thread.threadId}`}
        thread={thread}
        onReply={reply}
        defaultExpanded={position === 0}
      />
    ));
  }

  return (
    <Stack spacing={2}>
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="contained" onClick={() => setCompose({ object: kind, id, to: defaultTo })}>
          {t('New email')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refresh}
          loading={loading && Boolean(data)}
        >
          {t('Refresh')}
        </Button>
      </Flex>
      <ReconnectNotice />
      {body}
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
