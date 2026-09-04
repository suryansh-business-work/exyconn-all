import type { ReactElement } from 'react';
import { ListSubheader, MenuItem, TextField } from '@exyconn/ui';
import type { TrackerTask } from '@shared/types';
import { run } from '../run';

interface Props {
  tasks: TrackerTask[];
  selectedTaskId: string;
  /** A running session is already booked; changing it mid-flight would rewrite the record. */
  disabled: boolean;
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
}: Readonly<Props>): ReactElement {
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
      label="Ticket"
      value={selectedTaskId}
      disabled={disabled}
      helperText={
        disabled ? 'Locked while tracking — stop to book to another ticket.' : 'Optional.'
      }
      onChange={(event) => run(() => window.tracker.setTask(event.target.value))}
    >
      <MenuItem value="">No ticket</MenuItem>
      {mine.length > 0 && <ListSubheader>Assigned to me</ListSubheader>}
      {mine.map(option)}
      {others.length > 0 && <ListSubheader>Everything else</ListSubheader>}
      {others.map(option)}
    </TextField>
  );
}
