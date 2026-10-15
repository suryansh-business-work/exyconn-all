import { useT } from '@exyconn/i18n';
import { Card, Divider, Flex, Link } from '@exyconn/shell/components/ui';
import { DetailFact } from '@exyconn/shell/components/data/DetailFact';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { TaskFieldsFragment, TaskVisibility } from '@exyconn/shell/graphql/generated';
import { TicketColumnSelect, ticketPath, type TicketBoardColumn } from '../projects/ticket';
import { TicketVisibilityControl } from './TicketVisibilityControl';

interface TicketDetailsPanelProps {
  ticket: TaskFieldsFragment & { visibility: TaskVisibility; publicUrl?: string | null };
  columns: TicketBoardColumn[];
  /** The epic this ticket is filed under, when it is filed under one. */
  epic: Pick<TaskFieldsFragment, 'key' | 'title'> | null;
  switching: boolean;
  onMove: (columnId: string) => void;
  onVisibility: (visibility: TaskVisibility) => void;
  onCopy: (url: string) => void;
}

/**
 * The ticket page's right-hand column: where the ticket stands and who can see it — the two
 * things changed in one click — then the facts nobody edits.
 */
export function TicketDetailsPanel({
  ticket,
  columns,
  epic,
  switching,
  onMove,
  onVisibility,
  onCopy,
}: Readonly<TicketDetailsPanelProps>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  const reporter = ticket.reporterName === '' ? t('somebody who has left') : ticket.reporterName;

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Flex direction="column" spacing={2}>
        <TicketColumnSelect columns={columns} value={ticket.columnId} onChange={onMove} />
        <TicketVisibilityControl
          visibility={ticket.visibility}
          publicUrl={ticket.publicUrl ?? null}
          disabled={switching}
          onChange={onVisibility}
          onCopy={onCopy}
        />
        <Divider />
        <DetailFact label="Epic">
          {epic ? (
            <Link href={ticketPath(epic.key)}>{`${epic.key} · ${epic.title}`}</Link>
          ) : (
            t('None')
          )}
        </DetailFact>
        <DetailFact label="Assignee">{ticket.assigneeName || t('Unassigned')}</DetailFact>
        <DetailFact label="Reporter">{reporter}</DetailFact>
        <DetailFact label="Created">{formatDateTime(ticket.createdAt)}</DetailFact>
        <DetailFact label="Updated">{formatDateTime(ticket.updatedAt)}</DetailFact>
      </Flex>
    </Card>
  );
}
