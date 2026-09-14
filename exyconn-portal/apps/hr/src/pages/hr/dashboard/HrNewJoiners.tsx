import { useT } from '@exyconn/i18n';
import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import type { UserRow } from './hrDashboard.selectors';

interface HrNewJoinersProps {
  users: UserRow[];
  formatDate: (value: string) => string;
}

/** Who joined this month. */
export function HrNewJoiners({ users, formatDate }: Readonly<HrNewJoinersProps>) {
  const t = useT();
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Heading level={6}>{t('New joiners this month')}</Heading>
      {users.length === 0 && (
        <Text size="sm" color="text.secondary">
          {t('No one joined this month.')}
        </Text>
      )}
      {users.map((user) => (
        <Flex key={user.id} direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.5 }}>
          <PersonAddIcon fontSize="small" color="success" />
          <Box>
            <Text weight="medium">{user.name}</Text>
            <Text size="caption" color="text.secondary">
              {user.joinDate ? formatDate(user.joinDate) : '—'}
            </Text>
          </Box>
        </Flex>
      ))}
    </Box>
  );
}
