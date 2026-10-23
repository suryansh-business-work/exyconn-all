import EmailIcon from '@mui/icons-material/Email';
import { openDockPanel } from '@/components/compose-dock';
import { EmailComposerBody } from './EmailComposerBody';
import type { EmailDraft } from './forms/send-email';

/**
 * Opens the email window over the page, addressed and pre-filled from `draft`, to send from
 * the person's own mailbox. One window per set of recipients: opening it again brings that
 * window, and its draft, back.
 */
export function openEmail(draft: EmailDraft) {
  const to = draft.to.join(', ');
  openDockPanel({
    key: `email:${to}`,
    title: 'Email',
    subject: to,
    icon: <EmailIcon />,
    Body: EmailComposerBody,
    data: draft,
  });
}

/** The email window addressed to one person. */
export const openEmailTo = (address: string) => openEmail({ to: [address] });
