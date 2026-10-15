import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Flex,
  IconButton,
  Text,
} from '@exyconn/shell/components/ui';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useT } from '@exyconn/i18n';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useListProjectMembersQuery, type TaskInput } from '@exyconn/shell/graphql/generated';
import { TicketForm, type TicketOption, type TicketRow } from '../forms/ticket';
import { TICKET_PRIORITIES, TICKET_TYPES } from './ticket-meta';
import { TicketFacetIcon } from './TicketFacetIcon';
import { TicketTrail } from './TicketTrail';
import { openTicketInNewTab } from './ticket-links';
import { TicketColumnSelect, type TicketBoardColumn } from './TicketColumnSelect';
import { TicketAttachments } from '../attachments';
import { useTicket } from './useTicket';

interface TicketDialogProps {
  ticket: TicketRow | null;
  /** The project's epics, for the form's Epic picker. */
  epics: TicketOption[];
  onClose: () => void;
  /** Called after a save or a delete, so the board and the list reload. */
  onChanged: () => void;
  /** Given on the board: its columns and the move a drag makes, so a ticket can change column. */
  board?: {
    columns: TicketBoardColumn[];
    onMove: (taskId: string, toColumnId: string) => void;
  };
}

/**
 * One ticket, opened from the board or the list: its key and facets in the header, the whole
 * editable ticket as a form, and the conversation underneath. Closing without saving changes
 * nothing — the form is the only writer of ticket fields.
 */
export function TicketDialog({
  ticket,
  epics,
  onClose,
  onChanged,
  board,
}: Readonly<TicketDialogProps>) {
  const t = useT();
  const confirm = useConfirm();
  const { formatDateTime } = useSettings();
  const { data: memberData } = useListProjectMembersQuery();
  const { save, remove } = useTicket(onChanged);

  if (!ticket) {
    return null;
  }

  const assignees = (memberData?.listProjectMembers ?? []).map((member) => ({
    value: member.id,
    label: member.name,
  }));

  const submit = async (input: TaskInput) => {
    const saved = await save(ticket.id, input);
    if (saved) {
      onClose();
    }
  };

  const destroy = async () => {
    const ok = await confirm({
      message: 'Delete {key} — "{title}"?',
      messageValues: { key: ticket.key, title: ticket.title },
      confirmText: 'Delete',
    });
    if (ok && (await remove(ticket.id))) {
      onClose();
    }
  };

  const reporter = ticket.reporterName === '' ? t('somebody who has left') : ticket.reporterName;

  return (
    <Dialog open fullWidth maxWidth="md" onClose={onClose}>
      <DialogTitle sx={{ pb: 1 }}>
        <Flex direction="row" alignItems="center" spacing={1}>
          <TicketFacetIcon facet={TICKET_TYPES[ticket.type]} kind="Type" size={18} decorative />
          <TicketFacetIcon facet={TICKET_PRIORITIES[ticket.priority]} kind="Priority" size={18} />
          <Text size="label">{ticket.key}</Text>
          <Chip size="small" label={t(TICKET_TYPES[ticket.type].label)} />
          <Box sx={{ flex: 1 }} />
          <IconButton
            size="small"
            aria-label={t('Open {key} in a new page', { key: ticket.key })}
            onClick={() => openTicketInNewTab(ticket.key)}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={t('Delete ticket')} onClick={destroy}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={t('Close ticket')} onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Flex>
        <Text size="caption" color="text.secondary">
          {t('Reported by {who} · updated {when}', {
            who: reporter,
            when: formatDateTime(ticket.updatedAt),
          })}
        </Text>
      </DialogTitle>

      <DialogContent dividers>
        {board ? (
          <TicketColumnSelect
            columns={board.columns}
            value={ticket.columnId}
            onChange={(columnId) => board.onMove(ticket.id, columnId)}
          />
        ) : null}
        <TicketForm
          initial={ticket}
          assignees={assignees}
          epics={epics}
          onSubmit={submit}
          onCancel={onClose}
        />
        <Divider sx={{ my: 3 }} />

        <TicketAttachments
          taskId={ticket.id}
          title={ticket.title}
          files={ticket.attachments}
          onChanged={onChanged}
        />
        <Divider sx={{ my: 3 }} />

        <TicketTrail taskId={ticket.id} />
      </DialogContent>
    </Dialog>
  );
}
