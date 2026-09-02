import { Avatar, Box, Divider, Flex, Heading, Paper, Text } from '@/components/ui';
import { StatusChip } from '@/components/data/StatusChip';
import { glass } from '@/components/glass/glass';
import { useSettings } from '@/hooks/useSettings';
import { userStatus, type UserDetail } from './user-details.types';

/** Read-only summary card: identity, roles, status and audit timestamps. */
export function UserProfileCard({ user }: { user: UserDetail }) {
  const { formatDateTime } = useSettings();
  const initials = user.name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Paper sx={[glass, { p: 3 }]}>
      <Flex direction="row" spacing={2} alignItems="center">
        <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 64, height: 64 }}>
          {initials}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Heading level={6} noWrap>
            {user.name}
          </Heading>
          <Text size="sm" color="text.secondary" noWrap>
            {user.email}
          </Text>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <StatusChip value={userStatus(user)} />
      </Flex>

      <Divider sx={{ my: 2 }} />

      <Flex direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 2 }}>
        <Box>
          <Text size="overline" color="text.secondary">
            Department
          </Text>
          <Text size="sm">{user.department ?? '—'}</Text>
        </Box>
        <Box>
          <Text size="overline" color="text.secondary">
            Designation
          </Text>
          <Text size="sm">{user.designation ?? '—'}</Text>
        </Box>
        <Box>
          <Text size="overline" color="text.secondary">
            Employment
          </Text>
          <Text size="sm">{user.employmentStatus}</Text>
        </Box>
        <Box>
          <Text size="overline" color="text.secondary">
            Joined
          </Text>
          <Text size="sm">{user.joinDate ? formatDateTime(user.joinDate) : '—'}</Text>
        </Box>
      </Flex>

      <Text size="overline" color="text.secondary">
        Roles
      </Text>
      <Flex direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
        {user.roles.map((role) => (
          <StatusChip key={role} value={role} />
        ))}
      </Flex>

      {user.isBlocked && user.blockReason && (
        <Box sx={{ mt: 2 }}>
          <Text size="overline" color="text.secondary">
            Block reason
          </Text>
          <Text size="sm">{user.blockReason}</Text>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Flex direction={{ xs: 'column', sm: 'row' }} spacing={3}>
        <Box>
          <Text size="overline" color="text.secondary">
            Created
          </Text>
          <Text size="sm">{formatDateTime(user.createdAt)}</Text>
        </Box>
        <Box>
          <Text size="overline" color="text.secondary">
            Last updated
          </Text>
          <Text size="sm">{formatDateTime(user.updatedAt)}</Text>
        </Box>
      </Flex>
    </Paper>
  );
}
