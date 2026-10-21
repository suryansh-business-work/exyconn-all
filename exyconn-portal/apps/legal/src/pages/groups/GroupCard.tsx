import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useT } from '@exyconn/i18n';
import { Box, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import type { LegalGroupRow } from './forms/legal-group';

/** How many member titles a card lists before it says "and N more". */
const SHOWN_MEMBERS = 6;

interface Props {
  group: LegalGroupRow;
  /** Titles of the items in use in this group. */
  members: readonly { id: string; title: string }[];
  onEdit: (group: LegalGroupRow) => void;
  onDelete: (group: LegalGroupRow) => void;
}

/** One group: its name, what it is for, and what is in it. */
export function GroupCard({ group, members, onEdit, onDelete }: Readonly<Props>) {
  const t = useT();
  const hidden = members.length - SHOWN_MEMBERS;
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Flex direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Text weight="bold" component="h3" sx={{ m: 0 }}>
            {group.name}
          </Text>
          <Text size="caption" color="text.secondary">
            {t('{count} items in use', { count: members.length })}
          </Text>
        </Box>
        <Flex direction="row">
          <Tooltip title={t('Edit group')}>
            <IconButton aria-label={t('Edit group')} size="small" onClick={() => onEdit(group)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('Delete group')}>
            <IconButton
              aria-label={t('Delete group')}
              size="small"
              color="error"
              onClick={() => onDelete(group)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>
      {group.description && (
        <Text component="p" size="sm" color="text.secondary" sx={{ mt: 1 }}>
          {group.description}
        </Text>
      )}
      <Box component="ul" sx={{ pl: 3, mt: 1, mb: 0 }}>
        {members.slice(0, SHOWN_MEMBERS).map((member) => (
          <Text key={member.id} component="li" size="sm">
            {member.title}
          </Text>
        ))}
      </Box>
      {hidden > 0 && (
        <Text size="caption" color="text.secondary">
          {t('and {count} more', { count: hidden })}
        </Text>
      )}
    </Box>
  );
}
