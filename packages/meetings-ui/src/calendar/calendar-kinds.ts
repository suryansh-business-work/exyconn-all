import { color } from '@exyconn/ui';
import type { EntryKind } from './calendar-entries';

/** Each kind's colour (a design token) and its name in the legend. */
export const ENTRY_STYLE: Readonly<Record<EntryKind, { tone: string; label: string }>> = {
  meeting: { tone: color.violet[500], label: 'Recorded meeting' },
  event: { tone: color.blue[500], label: 'Google Calendar' },
};
