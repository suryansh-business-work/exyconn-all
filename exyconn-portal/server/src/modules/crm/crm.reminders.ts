import { ActivityModel } from './activity.model';
import { registerReminderSource, dayKey } from '../reminders';
import { ROLES } from '../../constants/roles';
import type { Reminder } from '../reminders';

/** How many follow-ups the summary names before it stops listing and starts counting. */
const NAMED = 3;

/**
 * The follow-up queue, as one notice a day rather than one per card.
 *
 * An activity with a due date and `done: false` has always been the follow-up queue, and
 * nothing ever read it. It is summarised rather than itemised on purpose: a sales desk can
 * easily carry thirty open follow-ups, and thirty notifications every morning is how a
 * team learns to ignore the bell.
 */
registerReminderSource({
  key: 'crm-followups',
  label: 'CRM follow-ups due',
  async due(now): Promise<Reminder[]> {
    const rows = await ActivityModel.find({ done: false, dueDate: { $ne: null, $lte: now } })
      .sort({ dueDate: 1 })
      .select('subject relatedName owner dueDate')
      .lean();
    if (rows.length === 0) {
      return [];
    }

    const named = rows
      .slice(0, NAMED)
      .map((row) => `${row.subject}${row.relatedName ? ` (${row.relatedName})` : ''}`)
      .join(', ');
    const rest = rows.length - Math.min(rows.length, NAMED);
    const tail = rest > 0 ? ` and ${rest} more` : '';

    return [
      {
        dedupeKey: `crm-followups:${dayKey(now)}`,
        kind: 'CRM',
        title: `${rows.length} follow-up${rows.length === 1 ? '' : 's'} due`,
        body: `${named}${tail}. Open the activities list to clear them or move the dates.`,
        link: '/crm/activities',
        roles: [ROLES.CRM],
      },
    ];
  },
});
