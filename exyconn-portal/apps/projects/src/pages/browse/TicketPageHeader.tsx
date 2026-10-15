import { useT } from '@exyconn/i18n';
import { Box, Button, Chip, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkIcon from '@mui/icons-material/Link';
import ShareIcon from '@mui/icons-material/ShareOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import PublicIcon from '@mui/icons-material/Public';
import { TaskVisibility, type TaskFieldsFragment } from '@exyconn/shell/graphql/generated';
import { TICKET_PRIORITIES, TICKET_TYPES, TicketFacetIcon } from '../projects/ticket';

interface TicketPageHeaderProps {
  ticket: TaskFieldsFragment & { visibility: TaskVisibility };
  projectName: string;
  onBack: () => void;
  onCopyLink: () => void;
  onShare: () => void;
  onDelete: () => void;
}

/** Where the ticket lives, what it is, and the three things done to a ticket as a whole. */
export function TicketPageHeader({
  ticket,
  projectName,
  onBack,
  onCopyLink,
  onShare,
  onDelete,
}: Readonly<TicketPageHeaderProps>) {
  const t = useT();
  const isPublic = ticket.visibility === TaskVisibility.Public;
  return (
    <Box sx={{ mb: 2 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} size="small" sx={{ mb: 1 }}>
        {projectName || t('Project')}
      </Button>
      <Flex direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <TicketFacetIcon facet={TICKET_TYPES[ticket.type]} kind="Type" size={18} decorative />
        <TicketFacetIcon facet={TICKET_PRIORITIES[ticket.priority]} kind="Priority" size={18} />
        <Text size="label">{ticket.key}</Text>
        <Chip size="small" label={t(TICKET_TYPES[ticket.type].label)} />
        <Chip
          size="small"
          variant="outlined"
          icon={isPublic ? <PublicIcon /> : <LockIcon />}
          label={isPublic ? t('Public') : t('Private')}
        />
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<LinkIcon />} onClick={onCopyLink}>
          {t('Copy link')}
        </Button>
        <Button size="small" variant="outlined" startIcon={<ShareIcon />} onClick={onShare}>
          {t('Share')}
        </Button>
        <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={onDelete}>
          {t('Delete')}
        </Button>
      </Flex>
      <Heading level={4} sx={{ mt: 1, overflowWrap: 'anywhere' }}>
        {ticket.title}
      </Heading>
    </Box>
  );
}
