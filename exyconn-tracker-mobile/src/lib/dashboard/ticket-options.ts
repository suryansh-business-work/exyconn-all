import type { TrackerTask } from '@exyconn/tracker-core';
import type { Option } from '../../components/ui/OptionSheet';

/** The ticket picker's first option — the project with no ticket, which is the default. */
export const NO_TICKET: Option = { value: '', label: 'No ticket' };

const ASSIGNED = 'Assigned to me';

function toOption(task: TrackerTask): Option {
  return {
    value: task.id,
    label: `${task.key} · ${task.title}`,
    caption: task.assignedToMe ? ASSIGNED : undefined,
  };
}

/**
 * "No ticket" first, then the employee's own assigned tickets, then everything else. The
 * desktop splits the list under two sub-headers; a bottom sheet has none, so each assigned
 * ticket carries its "Assigned to me" caption instead — and the search box finds them by it.
 */
export function ticketOptions(tasks: readonly TrackerTask[]): Option[] {
  const mine = tasks.filter((task) => task.assignedToMe);
  const others = tasks.filter((task) => !task.assignedToMe);
  return [NO_TICKET, ...mine.map(toOption), ...others.map(toOption)];
}
