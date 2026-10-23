import type { SvgIconComponent } from '@mui/icons-material';
import InboxIcon from '@mui/icons-material/Inbox';
import SendIcon from '@mui/icons-material/Send';
import StarIcon from '@mui/icons-material/Star';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import { CrmMailFolder } from '@exyconn/shell/graphql/generated';

/** CRM > Mail: the conversations of the company's connected mailboxes. */
export const MAIL_PATH = '/mail';

export interface MailFolderItem {
  /** The folder's part of the address, e.g. /mail/sent. */
  slug: string;
  folder: CrmMailFolder;
  label: string;
  icon: SvgIconComponent;
  /** Its unread count is shown beside it, as Gmail does for the inbox. */
  showsUnread: boolean;
}

export const MAIL_FOLDERS: readonly MailFolderItem[] = [
  {
    slug: 'inbox',
    folder: CrmMailFolder.Inbox,
    label: 'Inbox',
    icon: InboxIcon,
    showsUnread: true,
  },
  {
    slug: 'starred',
    folder: CrmMailFolder.Starred,
    label: 'Starred',
    icon: StarIcon,
    showsUnread: true,
  },
  { slug: 'sent', folder: CrmMailFolder.Sent, label: 'Sent', icon: SendIcon, showsUnread: false },
  {
    slug: 'all',
    folder: CrmMailFolder.All,
    label: 'All mail',
    icon: AllInboxIcon,
    showsUnread: false,
  },
];

/** The folder a slug names; the inbox for anything else. */
export const folderBySlug = (slug: string | undefined): MailFolderItem =>
  MAIL_FOLDERS.find((item) => item.slug === slug) ?? MAIL_FOLDERS[0];
