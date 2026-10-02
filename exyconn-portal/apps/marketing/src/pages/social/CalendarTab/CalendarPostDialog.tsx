import { useT } from '@exyconn/i18n';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { SocialPostForm, type NetworkRule, type ScheduleDefaults } from '../forms/social-post';
import type { Account } from '../useSocialAccounts';
import type { CalendarPostRow } from './calendar.status';

/** What the dialog is for: a stored post to edit, or a new one planned on a day. */
export interface CalendarDialogTarget {
  post: CalendarPostRow | null;
  schedule?: ScheduleDefaults;
}

interface CalendarPostDialogProps {
  target: CalendarDialogTarget | null;
  accounts: readonly Account[];
  rules: readonly NetworkRule[];
  onClose: () => void;
  onSaved: () => void;
}

/** The composer in a side panel, opened from a day or from a post on the calendar. */
export function CalendarPostDialog({
  target,
  accounts,
  rules,
  onClose,
  onSaved,
}: Readonly<CalendarPostDialogProps>) {
  const t = useT();
  return (
    <CrudDialog
      open={target !== null}
      title={target?.post ? t('Edit post') : t('Schedule a post')}
      onClose={onClose}
    >
      {target && (
        <SocialPostForm
          accounts={accounts}
          rules={rules}
          initial={target.post}
          schedule={target.schedule}
          onCancel={onClose}
          onDone={onSaved}
        />
      )}
    </CrudDialog>
  );
}
