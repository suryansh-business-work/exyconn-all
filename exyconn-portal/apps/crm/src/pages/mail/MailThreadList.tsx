import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Button, List, Stack } from '@exyconn/shell/components/ui';
import { ListSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { CrmMailAction, useCrmMailThreadsQuery } from '@exyconn/shell/graphql/generated';
import type { MailFolderItem } from './mailFolders';
import { MailListToolbar } from './MailListToolbar';
import { MailThreadRow, type MailRow } from './MailThreadRow';
import { useMailActions } from './useMailActions';
import type { OpenThread } from './useMailRoute';

export const MAIL_PAGE_SIZE = 25;

interface MailThreadListProps {
  folder: MailFolderItem;
  /** One mailbox's id; '' lists every readable mailbox together. */
  mailbox: string;
  search: string;
  page: number;
  open: OpenThread | null;
  onOpen: (thread: OpenThread) => void;
  onPageChange: (page: number) => void;
}

const refOf = (row: MailRow): OpenThread => ({ accountId: row.accountId, threadId: row.threadId });
const logFailure = (error: unknown) => portalLogger.warn('crm: mail list action failed', error);

/**
 * One page of the folder, newest first, with bulk actions on the selected conversations.
 * Keyed by its folder, mailbox, search and page, so a new view starts with nothing selected.
 */
export function MailThreadList({
  folder,
  mailbox,
  search,
  page,
  open,
  onOpen,
  onPageChange,
}: Readonly<MailThreadListProps>) {
  const t = useT();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const { run, busy } = useMailActions();
  const { data, error, refetch } = useCrmMailThreadsQuery({
    variables: {
      input: {
        accountId: mailbox || null,
        folder: folder.folder,
        search: search || null,
        page,
        pageSize: MAIL_PAGE_SIZE,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  if (error && !data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch().catch(logFailure)}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('The mail could not be loaded.'))}
      </Alert>
    );
  }
  if (!data) {
    return <ListSkeleton toolbar={false} rows={6} columns={2} label="Loading the mail" />;
  }

  const { rows, totalCount, warnings } = data.crmMailThreads;
  const toggle = (row: MailRow) => {
    const next = new Set(selected);
    if (next.has(row.id)) {
      next.delete(row.id);
    } else {
      next.add(row.id);
    }
    setSelected(next);
  };
  const bulk = async (action: CrmMailAction) => {
    const chosen = rows.filter((row) => selected.has(row.id)).map(refOf);
    if (await run(chosen, action)) {
      setSelected(new Set());
    }
  };
  const star = (row: MailRow) =>
    run([refOf(row)], row.starred ? CrmMailAction.Unstar : CrmMailAction.Star, true).catch(
      logFailure,
    );

  return (
    <Stack spacing={1}>
      {warnings.map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}
      <MailListToolbar
        selected={selected.size}
        onPage={rows.length}
        total={totalCount}
        page={page}
        pageSize={MAIL_PAGE_SIZE}
        busy={busy}
        onSelectAll={(all) => setSelected(new Set(all ? rows.map((row) => row.id) : []))}
        onAction={(action) => {
          bulk(action).catch(logFailure);
        }}
        onPageChange={onPageChange}
      />
      {rows.length === 0 ? (
        <EmptyState
          title={search ? 'Nothing matches that search' : 'No conversations here'}
          description={
            search
              ? 'Try other words, or search All mail.'
              : 'Sync to read the newest mail from the mailbox.'
          }
        />
      ) : (
        <List disablePadding aria-label={t(folder.label)}>
          {rows.map((row) => (
            <MailThreadRow
              key={row.id}
              row={row}
              checked={selected.has(row.id)}
              active={open?.accountId === row.accountId && open.threadId === row.threadId}
              showMailbox={!mailbox}
              onCheck={toggle}
              onOpen={(clicked) => onOpen(refOf(clicked))}
              onStar={(clicked) => {
                star(clicked);
              }}
            />
          ))}
        </List>
      )}
    </Stack>
  );
}
