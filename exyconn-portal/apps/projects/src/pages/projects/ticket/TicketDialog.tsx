import { useState } from 'react';
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Flex,
  IconButton,
  Tab,
  Tabs,
  Text,
} from '@exyconn/shell/components/ui';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useT } from '@exyconn/i18n';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useListProjectMembersQuery, type TaskInput } from '@exyconn/shell/graphql/generated';
import { TicketForm, type TicketRow } from '../forms/ticket';
import { TICKET_PRIORITIES, TICKET_TYPES } from './ticket-meta';
import { TicketFacetIcon } from './TicketFacetIcon';
import { TicketComments } from './TicketComments';
import { TicketActivity } from './TicketActivity';
import { TicketAttachments } from '../attachments';
import { useTicket } from './useTicket';

/** The two ways to read what has happened to a ticket. */
type TicketTrail = 'comments' | 'history';

interface TicketDialogProps {
  ticket: TicketRow | null;
  onClose: () => void;
  /** Called after a save or a delete, so the board and the list reload. */
  onChanged: () => void;
}

/**
 * One ticket, opened from the board or the list: its key and facets in the header, the whole
 * editable ticket as a form, and the conversation underneath. Closing without saving changes
 * nothing — the form is the only writer of ticket fields.
 */
export function TicketDialog({ ticket, onClose, onChanged }: Readonly<TicketDialogProps>) {
  const t = useT();
  const confirm = useConfirm();
  const [trail, setTrail] = useState<TicketTrail>('comments');
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
      message: t('Delete {key} — "{title}"?', { key: ticket.key, title: ticket.title }),
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
          <TicketFacetIcon facet={TICKET_TYPES[ticket.type]} kind="Type" size={18} />
          <TicketFacetIcon facet={TICKET_PRIORITIES[ticket.priority]} kind="Priority" size={18} />
          <Text size="label">{ticket.key}</Text>
          <Chip size="small" label={t(TICKET_TYPES[ticket.type].label)} />
          <Box sx={{ flex: 1 }} />
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
        <TicketForm initial={ticket} assignees={assignees} onSubmit={submit} onCancel={onClose} />
        <Divider sx={{ my: 3 }} />

        <TicketAttachments
          taskId={ticket.id}
          title={ticket.title}
          files={ticket.attachments}
          onChanged={onChanged}
        />
        <Divider sx={{ my: 3 }} />

        <Tabs
          value={trail}
          onChange={(_event, next: TicketTrail) => setTrail(next)}
          aria-label={t('Ticket conversation and history')}
          sx={{ mb: 2 }}
        >
          <Tab value="comments" label={t('Comments')} />
          <Tab value="history" label={t('History')} />
        </Tabs>

        {trail === 'comments' ? (
          <TicketComments taskId={ticket.id} />
        ) : (
          <TicketActivity taskId={ticket.id} />
        )}
      </DialogContent>
    </Dialog>
  );
}
