import { useNavigate } from 'react-router-dom';
import MailOutlineIcon from '@mui/icons-material/MailOutlineOutlined';
import { Box } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { GmailAccountStatus } from '@exyconn/shell/graphql/generated';
import { EMAIL_INTEGRATIONS_PATH } from '../../integrations/emailIntegrationsPath';
import type { MailboxItem } from './MailboxList';

/** Why there is no mail to show, in the case that applies. */
function reasonOf(mailboxes: MailboxItem[]) {
  if (mailboxes.some((mailbox) => mailbox.status === GmailAccountStatus.NeedsReconnect)) {
    return 'Google refused the connection to your Gmail mailbox. Reconnect it in CRM > Integrations > Email to read your mail here.';
  }
  if (mailboxes.length > 0) {
    return 'Your Microsoft mailboxes are connected to send email only. Connect a Gmail mailbox in CRM > Integrations > Email to read and answer mail here.';
  }
  return 'Connect a Gmail mailbox in CRM > Integrations > Email to read, search and answer your mail here. Replies land on the contact’s timeline too.';
}

/** CRM > Mail with no mailbox it can read: what is missing and where to connect one. */
export function MailEmptyState({ mailboxes }: Readonly<{ mailboxes: MailboxItem[] }>) {
  const navigate = useNavigate();
  return (
    <Box sx={readingPanel}>
      <EmptyState
        icon={<MailOutlineIcon />}
        title="No mailbox to read yet"
        description={reasonOf(mailboxes)}
        actionLabel="Connect a mailbox"
        onAction={() => navigate(EMAIL_INTEGRATIONS_PATH)}
      />
    </Box>
  );
}
