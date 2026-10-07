import type { CalendarDialogTarget } from '../../../../../src/pages/social/CalendarTab/CalendarPostDialog';

interface DialogStubProps {
  target: CalendarDialogTarget | null;
  onClose: () => void;
  onSaved: () => void;
}

/** What the dialog was opened for, in words a test can find. */
function describeTarget(target: CalendarDialogTarget | null): string {
  if (!target) return 'No dialog';
  if (target.post) return `Editing ${target.post.id}`;
  return `Planning ${target.schedule?.accountIds.join('+')} at ${target.schedule?.scheduledAt}`;
}

/** Stands in for CalendarPostDialog (tested on its own): shows its target and its callbacks. */
export function CalendarDialogStub({ target, onClose, onSaved }: Readonly<DialogStubProps>) {
  return (
    <div>
      <p>{describeTarget(target)}</p>
      <button type="button" onClick={onClose}>
        Close dialog
      </button>
      <button type="button" onClick={onSaved}>
        Save dialog
      </button>
    </div>
  );
}
