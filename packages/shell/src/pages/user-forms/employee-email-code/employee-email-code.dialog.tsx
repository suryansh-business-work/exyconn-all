import type { SubmitEvent } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Dialog, DialogContent, DialogTitle } from '@/components/ui';
import { EmployeeEmailCodeForm } from './employee-email-code.form';
import type { EmployeeEmailTarget } from './employee-email-code.types';

/**
 * The code form opens from inside the employee form. React sends a submit through a portal
 * to the form around it, so it stops here and never saves the employee as well.
 */
const keepSubmitInside = (event: SubmitEvent) => event.stopPropagation();

interface EmployeeEmailCodeDialogProps {
  /** The address being proven; null while the dialog is closed. */
  target: EmployeeEmailTarget | null;
  onClose: () => void;
}

/** An MUI dialog holding the code form for one of an employee's addresses. */
export function EmployeeEmailCodeDialog({
  target,
  onClose,
}: Readonly<EmployeeEmailCodeDialogProps>) {
  const t = useT();
  return (
    <Dialog open={target !== null} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('Verify email address')}</DialogTitle>
      <DialogContent>
        <Box onSubmit={keepSubmitInside} sx={{ pt: 1 }}>
          {target && <EmployeeEmailCodeForm {...target} onDone={onClose} onCancel={onClose} />}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
