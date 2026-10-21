import type { ICellRendererParams } from 'ag-grid-community';
import { useFormatters, useT } from '@exyconn/i18n';
import { Checkbox, Chip, Flex, Text } from '@exyconn/shell/components/ui';
import { MaActionStatus } from '@exyconn/shell/graphql/generated';
import type { ActionItemRow } from '../forms/action-item';
import { useActionSelection } from './selection';

type CellParams = Readonly<ICellRendererParams<ActionItemRow>>;

/** What the "done" checkbox calls, read off the grid context. */
export interface ActionCellContext {
  actions: { toggleDone: (row: ActionItemRow) => void };
}

/** Ticks the row for a bulk update. */
export function SelectCell({ data }: CellParams) {
  const t = useT();
  const { selected, toggle } = useActionSelection();
  if (!data) {
    return null;
  }
  return (
    <Checkbox
      size="small"
      checked={selected.has(data.id)}
      onChange={() => toggle(data.id)}
      onClick={(event) => event.stopPropagation()}
      slotProps={{ input: { 'aria-label': t('Select {title}', { title: data.title }) } }}
    />
  );
}

/** Completes the item, or reopens a completed one. */
export function DoneCell({ data, context }: CellParams) {
  const t = useT();
  if (!data) {
    return null;
  }
  const done = data.status === MaActionStatus.Completed;
  const label = done ? 'Reopen {title}' : 'Mark {title} complete';
  return (
    <Checkbox
      size="small"
      checked={done}
      onChange={() => (context as ActionCellContext).actions.toggleDone(data)}
      onClick={(event) => event.stopPropagation()}
      slotProps={{ input: { 'aria-label': t(label, { title: data.title }) } }}
    />
  );
}

/** The owner, flagged while an AI-suggested owner or deadline is unconfirmed. */
export function OwnerCell({ data }: CellParams) {
  const t = useT();
  if (!data) {
    return null;
  }
  return (
    <Flex direction="row" spacing={0.5} alignItems="center">
      <Text size="sm">{data.assignedTo ?? t('Unassigned')}</Text>
      {data.needsConfirmation && (
        <Chip size="small" color="warning" variant="outlined" label={t('Needs confirmation')} />
      )}
    </Flex>
  );
}

/** The due date in the viewer's format (or the words said in the call), flagged when overdue. */
export function DueCell({ data }: CellParams) {
  const t = useT();
  const { formatDate } = useFormatters();
  if (!data) {
    return null;
  }
  const due = data.dueDate ? formatDate(data.dueDate) : (data.dueText ?? '—');
  return (
    <Flex direction="row" spacing={0.5} alignItems="center">
      <Text size="sm">{due}</Text>
      {data.overdue && <Chip size="small" color="error" label={t('Overdue')} />}
    </Flex>
  );
}
