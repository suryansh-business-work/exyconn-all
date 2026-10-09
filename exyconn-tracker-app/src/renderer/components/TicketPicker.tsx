import type { ReactElement } from 'react';
import { ListSubheader, MenuItem, TextField } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { TrackerTask } from '@shared/types';
import { ticketHint } from '@exyconn/tracker-core';
import { run } from '../run';
import SelectSpinner from './SelectSpinner';

interface Props {
  tasks: TrackerTask[];
  selectedTaskId: string;
  /** A running session is already booked; changing it mid-flight would rewrite the record. */
  disabled: boolean;
  /** The selected project's tickets are being read from the portal. */
  loading: boolean;
}

/**
 * Which ticket the next session books against.
 *
 * "No ticket" is the first option and the default, not an omission: plenty of real work on a
 * project belongs to no card, and a picker that forced a choice would have people attaching
 * their time to whatever ticket happened to be top of the list.
 *
 * Locked while tracking, for the same reason the project is — the ticket was written onto the
 * session when it opened. Switching ticket means stopping and starting, which is honest: the
 * time before the switch really was spent on the other one.
 */
export default function TicketPicker({
  tasks,
  selectedTaskId,
  disabled,
  loading,
}: Readonly<Props>): ReactElement {
  const t = useT();
  const mine = tasks.filter((task) => task.assignedToMe);
  const others = tasks.filter((task) => !task.assignedToMe);

  const option = (task: TrackerTask) => (
    <MenuItem key={task.id} value={task.id}>
      {task.key} · {task.title}
    </MenuItem>
  );

  return (
    <TextField
      select
      size="small"
      fullWidth
      label={t('Ticket')}
      value={selectedTaskId}
      disabled={disabled || loading}
      helperText={ticketHint(t, { loading, locked: disabled })}
      onChange={(event) => run(() => globalThis.tracker.setTask(event.target.value))}
      slotProps={{ select: { IconComponent: loading ? SelectSpinner : undefined } }}
    >
      <MenuItem value="">{t('No ticket')}</MenuItem>
      {mine.length > 0 && <ListSubheader>{t('Assigned to me')}</ListSubheader>}
      {mine.map(option)}
      {others.length > 0 && <ListSubheader>{t('Everything else')}</ListSubheader>}
      {others.map(option)}
    </TextField>
  );
}
