import { useT } from '@exyconn/i18n';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from '@exyconn/shell/components/ui';
import { WorkflowDetailsForm, type WorkflowDetailsValues } from './forms/workflow-details';

interface WorkflowDetailsDialogProps {
  open: boolean;
  /** English source, translated here. */
  title: string;
  initial: WorkflowDetailsValues;
  isEdit: boolean;
  onSubmit: (values: WorkflowDetailsValues) => Promise<void> | void;
  onClose: () => void;
}

/** The workflow details form in a dialog (full screen on a phone). */
export function WorkflowDetailsDialog({
  open,
  title,
  initial,
  isEdit,
  onSubmit,
  onClose,
}: Readonly<WorkflowDetailsDialogProps>) {
  const t = useT();
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={phone}>
      <DialogTitle>{t(title)}</DialogTitle>
      <DialogContent>
        {open && (
          <WorkflowDetailsForm
            initial={initial}
            isEdit={isEdit}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
