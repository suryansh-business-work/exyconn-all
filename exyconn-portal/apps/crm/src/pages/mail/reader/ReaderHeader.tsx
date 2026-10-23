import { Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import { useT } from '@exyconn/i18n';
import { Chip, Flex, Heading, IconButton, Tooltip } from '@exyconn/shell/components/ui';
import { CrmMailAction, CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import type { MailThread } from '../mailCompose';

interface ReaderHeaderProps {
  thread: MailThread;
  busy: boolean;
  onBack: () => void;
  onAction: (action: CrmMailAction) => void;
}

/** The CRM page of the contact or company the conversation is with. */
export function recordHref(record: NonNullable<MailThread['record']>) {
  const base = record.object === CrmTimelineObject.Company ? '/companies' : '/contacts';
  return `${base}/${record.id}`;
}

/** The record the conversation is with, as a link to its CRM page. */
export function RecordChip({ record }: Readonly<{ record: MailThread['record'] }>) {
  if (!record) {
    return null;
  }
  const isCompany = record.object === CrmTimelineObject.Company;
  return (
    <Chip
      size="small"
      clickable
      component={RouterLink}
      to={recordHref(record)}
      icon={isCompany ? <BusinessIcon /> : <PersonIcon />}
      label={record.name}
      variant="outlined"
    />
  );
}

/** The open conversation's subject, its record, and what can be done with it. */
export function ReaderHeader({ thread, busy, onBack, onAction }: Readonly<ReaderHeaderProps>) {
  const t = useT();
  const starAction = thread.starred ? CrmMailAction.Unstar : CrmMailAction.Star;
  const actions = [
    ...(thread.inbox
      ? [{ action: CrmMailAction.Archive, label: 'Archive', icon: <ArchiveIcon /> }]
      : []),
    { action: CrmMailAction.Trash, label: 'Move to trash', icon: <DeleteIcon /> },
    { action: CrmMailAction.MarkUnread, label: 'Mark as unread', icon: <MarkEmailUnreadIcon /> },
    {
      action: starAction,
      label: thread.starred ? 'Remove star' : 'Star',
      icon: thread.starred ? <StarIcon color="warning" /> : <StarBorderIcon />,
    },
  ];
  return (
    <Flex direction="column" spacing={1}>
      <Flex direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Tooltip title={t('Back to the list')}>
          <IconButton onClick={onBack} aria-label={t('Back to the list')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        {actions.map((item) => (
          <Tooltip key={item.action} title={t(item.label)}>
            <span>
              <IconButton
                onClick={() => onAction(item.action)}
                aria-label={t(item.label)}
                disabled={busy}
              >
                {item.icon}
              </IconButton>
            </span>
          </Tooltip>
        ))}
      </Flex>
      <Heading level={2} sx={{ typography: 'h6', overflowWrap: 'anywhere' }}>
        {thread.subject || t('(no subject)')}
      </Heading>
      <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip size="small" label={thread.mailbox} />
        <RecordChip record={thread.record} />
      </Flex>
    </Flex>
  );
}
