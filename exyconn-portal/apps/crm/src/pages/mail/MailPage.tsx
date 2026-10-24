import { useT } from '@exyconn/i18n';
import { Alert, Box, Button } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { ListSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useCrmMailOverviewQuery } from '@exyconn/shell/graphql/generated';
import { openComposeEmail } from '../../records/comms';
import { MailEmptyState } from './MailEmptyState';
import { MailLayout } from './MailLayout';
import { MailRail } from './MailRail';
import { MailListHeader } from './MailListHeader';
import { MailThreadList } from './MailThreadList';
import { MailReader } from './reader/MailReader';
import { useMailRoute } from './useMailRoute';
import { useMailSync } from './useMailSync';

/**
 * CRM > Mail: the company's connected mailboxes in one place, like Gmail. Folders and
 * mailboxes on the left, the conversations in the middle, the open one on the right (on a
 * phone, one at a time). Everything shown lives in the address, so links and Back work.
 */
export function MailPage() {
  const t = useT();
  const route = useMailRoute();
  const overview = useCrmMailOverviewQuery({
    variables: { accountId: route.mailbox || null },
    fetchPolicy: 'cache-and-network',
  });
  const mailboxes = overview.data?.crmMailOverview.mailboxes ?? [];
  const readable = mailboxes.filter((mailbox) => mailbox.readable);
  const sync = useMailSync(route.mailbox, readable.length > 0);

  if (overview.error && !overview.data) {
    const retry = () => {
      overview.refetch().catch((error: unknown) => portalLogger.warn('crm: mail retry', error));
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
        {errorMessage(overview.error, t('The mailboxes could not be loaded.'))}
      </Alert>
    );
  }
  if (!overview.data) {
    return (
      <Box sx={panel}>
        <ListSkeleton toolbar rows={8} columns={2} label="Loading your mail" />
      </Box>
    );
  }
  if (readable.length === 0) {
    return <MailEmptyState mailboxes={mailboxes} />;
  }

  const { folder, mailbox, search, sort, filters, listFilters, page, thread } = route;
  const closeReader = () => route.change({ thread: null });
  return (
    <MailLayout
      reading={thread !== null}
      rail={
        <MailRail
          folder={folder}
          mailbox={mailbox}
          mailboxes={mailboxes}
          counts={overview.data.crmMailOverview.folders}
          sync={sync}
          onCompose={() =>
            openComposeEmail({
              object: 'CONTACT',
              id: '',
              to: [],
              fromAccountId: mailbox || readable[0].id,
            })
          }
          onMailbox={(id) => route.change({ mailbox: id, page: null, thread: null })}
        />
      }
      list={
        <>
          <MailListHeader
            key={folder.slug}
            search={search}
            sort={sort}
            filters={filters}
            onSearch={(q) => route.change({ q, page: null })}
            onSort={(next) => route.change({ sort: next, page: null })}
            onFilters={(next) => route.change({ filters: next, page: null })}
          />
          <MailThreadList
            key={[folder.slug, mailbox, search, sort, JSON.stringify(listFilters), page].join('|')}
            folder={folder}
            mailbox={mailbox}
            search={search}
            sort={sort}
            filters={listFilters}
            page={page}
            open={thread}
            onOpen={(next) => route.change({ thread: next })}
            onPageChange={(next) => route.change({ page: next })}
          />
        </>
      }
      reader={
        thread && (
          <MailReader
            key={`${thread.accountId}:${thread.threadId}`}
            open={thread}
            onClose={closeReader}
          />
        )
      }
    />
  );
}
