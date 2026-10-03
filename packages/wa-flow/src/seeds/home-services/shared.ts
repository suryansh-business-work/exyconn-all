/**
 * Node builders the HomeEase journeys share: the day → time-slot pair every booking,
 * reschedule and revisit uses. Technicians work all seven days, 8 am – 8 pm IST.
 */
import type { AuthorNode } from '../../author';

interface SlotPickerOptions {
  /** Id prefix: nodes are `<prefix>day` and `<prefix>slot`. */
  prefix: string;
  /** Where a picked slot leads. */
  next: string;
  dayText: string;
  slotText: string;
}

/** A dynamic day list and a dynamic slot list (with a "pick another day" row). */
export function slotPicker({ prefix, next, dayText, slotText }: SlotPickerOptions): AuthorNode[] {
  const day = `${prefix}day`;
  return [
    {
      id: day,
      type: 'list',
      data: {
        text: dayText,
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: `${prefix}slot` },
    },
    {
      id: `${prefix}slot`,
      type: 'list',
      data: {
        text: slotText,
        footer: 'Times in IST · technician arrives within the slot',
        button: 'Choose time',
        sections: [
          {
            id: 'more',
            title: 'More options',
            rows: [{ id: 'other-day', title: 'Pick another day' }],
          },
        ],
        dynamic: {
          kind: 'slots',
          dayVar: 'day',
          from: 8,
          to: 20,
          stepMin: 60,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: next, 'other-day': day },
    },
  ];
}
