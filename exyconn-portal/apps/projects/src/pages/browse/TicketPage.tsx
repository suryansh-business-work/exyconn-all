import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Card, Divider, Grid } from '@exyconn/shell/components/ui';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { TaskType, type TaskInput } from '@exyconn/shell/graphql/generated';
import { TicketForm } from '../projects/forms/ticket';
import { TicketAttachments } from '../projects/attachments';
import { TicketTrail, epicOptionsOf, ticketPath, useTicket } from '../projects/ticket';
import { useTicketPage } from './useTicketPage';
import { TicketPageHeader } from './TicketPageHeader';
import { TicketDetailsPanel } from './TicketDetailsPanel';
import { TicketChildren } from './TicketChildren';
import { ShareTicketDialog } from './ShareTicketDialog';

/**
 * One ticket as a page of its own, at `/projects/browse/<KEY>` — the address notifications,
 * copied links and "open in a new page" all lead to. The same form, files and conversation
 * as the board's quick-look dialog, with room for what a page can show and a dialog cannot:
 * the epic it belongs to, the tickets under it, who can see it and who it was sent to.
 */
export function TicketPage() {
  const { key = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const notify = useNotify();
  const page = useTicketPage(key);
  const { save, remove } = useTicket(page.reload);
  const [sharing, setSharing] = useState(false);
  const { ticket, tickets, columns } = page;

  const statusOf = useMemo(
    () => new Map(columns.map((column) => [column.id, column.name])),
    [columns],
  );

  if (page.loading) {
    return <LoadingState />;
  }
  if (page.error) {
    return <Alert severity="error">{errorMessage(page.error, 'Could not load the ticket')}</Alert>;
  }
  if (!ticket) {
    return (
      <EmptyState
        icon={<SearchOffIcon />}
        title="There is no ticket {key}"
        titleValues={{ key }}
        description="It may have been deleted, or the key may be mistyped."
        actionLabel="Go to projects"
        onAction={() => navigate('/projects/list')}
      />
    );
  }

  const boardPath = `/projects/${ticket.projectId}/board`;
  const epic = tickets.find((one) => one.id === ticket.parentTaskId) ?? null;
  const issues = tickets.filter((one) => one.parentTaskId === ticket.id);

  const copy = async (url: string) => {
    const ok = await copyToClipboard(url);
    notify(ok ? 'Link copied' : 'Could not copy the link', ok ? 'success' : 'error');
  };

  const destroy = async () => {
    const ok = await confirm({
      message: 'Delete {key} — "{title}"?',
      messageValues: { key: ticket.key, title: ticket.title },
      confirmText: 'Delete',
    });
    if (ok && (await remove(ticket.id))) {
      navigate(`/projects/${ticket.projectId}/tickets`);
    }
  };

  const submit = async (input: TaskInput) => {
    await save(ticket.id, input);
  };

  return (
    <>
      <TicketPageHeader
        ticket={ticket}
        projectName={page.project?.name ?? ''}
        onBack={() => navigate(boardPath)}
        onCopyLink={() => copy(`${globalThis.location.origin}${ticketPath(ticket.key)}`)}
        onShare={() => setSharing(true)}
        onDelete={destroy}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <TicketForm
              key={ticket.id}
              initial={ticket}
              assignees={page.people}
              epics={epicOptionsOf(tickets, ticket.id)}
              onSubmit={submit}
              onCancel={() => navigate(boardPath)}
            />
            <Divider sx={{ my: 3 }} />
            <TicketAttachments
              taskId={ticket.id}
              title={ticket.title}
              files={ticket.attachments}
              onChanged={page.reload}
            />
            {ticket.type === TaskType.Epic ? (
              <>
                <Divider sx={{ my: 3 }} />
                <TicketChildren issues={issues} statusOf={statusOf} />
              </>
            ) : null}
            <Divider sx={{ my: 3 }} />
            <TicketTrail taskId={ticket.id} />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TicketDetailsPanel
            ticket={ticket}
            columns={columns}
            epic={epic}
            switching={page.switching}
            onMove={page.move}
            onVisibility={page.changeVisibility}
            onCopy={copy}
          />
        </Grid>
      </Grid>

      <ShareTicketDialog
        open={sharing}
        taskId={ticket.id}
        ticketKey={ticket.key}
        recipients={page.people}
        onClose={() => setSharing(false)}
      />
    </>
  );
}
