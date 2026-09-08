import { Dialog, DialogContent, DialogTitle } from '@exyconn/shell/components/ui';
import { ForgotPasswordForm } from './forgot-password.form';

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

/** The small dialog "Forgot password?" opens over the sign-in card. */
export function ForgotPasswordDialog({ open, onClose }: Readonly<ForgotPasswordDialogProps>) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reset your password</DialogTitle>
      <DialogContent>
        <ForgotPasswordForm onCancel={onClose} onDone={onClose} />
      </DialogContent>
    </Dialog>
  );
}
