import { useT } from '@exyconn/i18n';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { AddReminderForm } from './forms/add-reminder';
import {
  LogActivityForm,
  type LogActivityTarget,
  type LogActivityValues,
} from './forms/log-activity';

/** What can be logged against a record: an activity of a type, or a reminder. */
export type ActivityChoice = LogActivityValues['type'] | 'REMINDER';

interface ActivityDialogProps {
  target: LogActivityTarget;
  /** The form to show; null keeps the dialog closed. */
  choice: ActivityChoice | null;
  onClose: () => void;
}

/** The log-activity or add-reminder form for a record, in a dialog. */
export function ActivityDialog({ target, choice, onClose }: Readonly<ActivityDialogProps>) {
  const t = useT();
  const reminder = choice === 'REMINDER';
  return (
    <CrudDialog
      open={choice !== null}
      title={reminder ? t('Add reminder') : t('Log activity')}
      onClose={onClose}
    >
      {reminder && <AddReminderForm target={target} onDone={onClose} onCancel={onClose} />}
      {choice !== null && !reminder && (
        <LogActivityForm target={target} type={choice} onDone={onClose} onCancel={onClose} />
      )}
    </CrudDialog>
  );
}
