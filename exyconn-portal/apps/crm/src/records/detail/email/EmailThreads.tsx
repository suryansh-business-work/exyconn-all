import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Button, List, Stack, TablePagination } from '@exyconn/shell/components/ui';
import { ListSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { CrmEmailDirection, type CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import { openComposeEmail } from '../../comms';
import { replySubject } from '../forms/compose-email';
import { activeFilterCount } from '../forms/email-thread-filters';
import { EmailFiltersDrawer } from './EmailFiltersDrawer';
import { EmailThreadRow } from './EmailThreadRow';
import { EmailThreadsToolbar } from './EmailThreadsToolbar';
import { EmailThreadView } from './EmailThreadView';
import { threadKey, type EmailThread } from './emailTypes';
import { ReconnectNotice } from './ReconnectNotice';
import { EMAIL_PAGE_SIZES, useEmailThreadPage } from './useEmailThreadPage';

interface EmailThreadsProps {
  object: CrmTimelineObject;
  id: string;
  /** Who a new email goes to by default: the record's primary address. */
  defaultTo: string[];
}

/** The open conversation is kept in the address, so Back and a shared link return to it. */
const THREAD_PARAM = 'thread';

/**
 * The Emails tab, like Gmail: a searchable, sortable, filterable list of every conversation with
 * the record across the CRM's enabled mailboxes, page by page; a click opens the conversation.
 */
export function EmailThreads({ object, id, defaultTo }: Readonly<EmailThreadsProps>) {
  const t = useT();
  const kind = object === 'CONTACT' ? 'CONTACT' : 'COMPANY';
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const list = useEmailThreadPage(object, id);
  const { data, error } = list.query;
  const result = data?.crmEmailThreadPage;
  const openKey = params.get(THREAD_PARAM);
  const openThread = result?.rows.find((thread) => threadKey(thread) === openKey) ?? null;

  const setOpen = (thread: EmailThread | null) => {
    const next = new URLSearchParams(params);
    if (thread) {
      next.set(THREAD_PARAM, threadKey(thread));
    } else {
      next.delete(THREAD_PARAM);
    }
    setParams(next);
  };

  const reply = (thread: EmailThread) => {
    const last = thread.messages.at(-1);
    const lastIn = thread.messages.findLast((m) => m.direction === CrmEmailDirection.In);
    openComposeEmail({
      object: kind,
      id,
      to: lastIn ? [lastIn.from] : defaultTo,
      subject: replySubject(thread.subject),
      threadId: thread.threadId,
      inReplyTo: last?.messageId,
      fromAccountId: thread.accountId || undefined,
    });
  };

  let body;
  if (error && !result) {
    body = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={list.refresh}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the emails.'))}
      </Alert>
    );
  } else if (!result) {
    body = <ListSkeleton toolbar={false} rows={3} columns={3} label="Loading the emails" />;
  } else if (openThread) {
    body = <EmailThreadView thread={openThread} onBack={() => setOpen(null)} onReply={reply} />;
  } else if (result.rows.length === 0) {
    body = (
      <EmptyState
        title="No emails found"
        description="Emails to and from the record's addresses in the connected mailboxes show here. Try another search or clear the filters."
      />
    );
  } else {
    body = (
      <>
        <List disablePadding aria-label={t('Emails')}>
          {result.rows.map((thread) => (
            <EmailThreadRow key={threadKey(thread)} thread={thread} onOpen={setOpen} />
          ))}
        </List>
        <TablePagination
          component="div"
          count={result.totalCount}
          page={list.page}
          rowsPerPage={list.pageSize}
          rowsPerPageOptions={EMAIL_PAGE_SIZES}
          onPageChange={(_event, next) => list.setPage(next)}
          onRowsPerPageChange={(event) =>
            list.changePageSize(Number.parseInt(event.target.value, 10))
          }
          labelRowsPerPage={t('Per page')}
        />
      </>
    );
  }

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      {!openThread && (
        <EmailThreadsToolbar
          search={list.search}
          sort={list.sort}
          filterCount={activeFilterCount(list.filters)}
          syncing={list.syncing}
          onSearch={list.changeSearch}
          onSort={list.changeSort}
          onOpenFilters={() => setFiltersOpen(true)}
          onNewEmail={() => openComposeEmail({ object: kind, id, to: defaultTo })}
          onRefresh={list.refresh}
        />
      )}
      <ReconnectNotice />
      {body}
      <EmailFiltersDrawer
        open={filtersOpen}
        filters={list.filters}
        mailboxes={result?.mailboxes ?? []}
        onApply={(next) => {
          list.applyFilters(next);
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
      />
    </Stack>
  );
}
