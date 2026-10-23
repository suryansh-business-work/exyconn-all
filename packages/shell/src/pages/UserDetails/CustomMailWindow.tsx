import EmailIcon from '@mui/icons-material/Email';
import { openDockPanel, type DockBodyProps } from '@/components/compose-dock';
import { CustomMailForm } from '../user-forms/custom-mail';

interface CustomMailData {
  userId: string;
  recipient: { name: string; email: string };
}

/** The admin's custom email to one user, sent through the platform mailer, in the dock. */
function CustomMailBody({ panel, onClose }: Readonly<DockBodyProps>) {
  const { userId, recipient } = panel.data as CustomMailData;
  return (
    <CustomMailForm userId={userId} recipient={recipient} onCancel={onClose} onDone={onClose} />
  );
}

/**
 * Opens the custom email to a user in the floating email window rather than a dialog, so the
 * record stays readable while writing.
 */
export function openCustomMail(user: Readonly<{ id: string; name: string; email: string }>) {
  openDockPanel({
    key: `user-mail:${user.id}`,
    title: 'Email',
    subject: user.name,
    icon: <EmailIcon />,
    Body: CustomMailBody,
    data: { userId: user.id, recipient: { name: user.name, email: user.email } },
  });
}
