import { useMemo } from 'react';
import type { TrackerTask } from '@exyconn/tracker-core';
import { NO_TICKET, ticketOptions } from '../../lib/dashboard/ticket-options';
import { tracker } from '../../tracker/instance';
import { PickerField } from '../form/PickerField';

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
 * their time to whatever ticket happened to be top of the list. The employee's own assigned
 * tickets come next, then everything else.
 *
 * Locked while tracking, for the same reason the project is — the ticket was written onto the
 * session when it opened. Switching ticket means stopping and starting, which is honest: the
 * time before the switch really was spent on the other one.
 */
export function TicketPicker({ tasks, selectedTaskId, disabled }: Readonly<Props>) {
  const options = useMemo(() => ticketOptions(tasks), [tasks]);

  return (
    <PickerField
      id="ticket"
      label="Ticket"
      options={options}
      selected={selectedTaskId}
      placeholder={NO_TICKET.label}
      hint={disabled ? 'Locked while tracking — stop to book to another ticket.' : 'Optional.'}
      disabled={disabled}
      searchable
      onSelect={(taskId) => tracker.setTask(taskId)}
    />
  );
}
