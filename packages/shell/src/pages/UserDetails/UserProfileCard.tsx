import { Avatar, Box, Divider, Flex, Heading, Link, Paper, Text } from '@/components/ui';
import { StatusChip } from '@/components/data/StatusChip';
import { DetailFact, DetailFactGrid } from '@/components/data/DetailFact';
import { SocialLinkButtons } from '@/components/profile/SocialLinkButtons';
import { useSettings } from '@/hooks/useSettings';
import { WorkArrangementFacts } from '@/components/work';
import { presenceStatus, userInitials, userStatus, type UserDetail } from './user-details.types';
import { readingPanel } from '@/components/glass/glass';

/** Read-only summary card: identity, presence, contact, work facts, roles and audit timestamps. */
export function UserProfileCard({ user }: Readonly<{ user: UserDetail }>) {
  const { formatDateTime } = useSettings();
  const joined = user.joinDate ? formatDateTime(user.joinDate) : '—';
  const probationEnds = user.probationEndDate
    ? formatDateTime(user.probationEndDate)
    : 'Not on probation';
  const lastActive = user.lastActiveAt ? formatDateTime(user.lastActiveAt) : 'Never';

  return (
    <Paper sx={readingPanel}>
      <Flex direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <Avatar src={user.avatarUrl ?? undefined} alt="" aria-hidden sx={{ width: 64, height: 64 }}>
          {userInitials(user.name)}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Heading level={6} noWrap>
            {user.name}
          </Heading>
          <Text size="sm" color="text.secondary" noWrap>
            {user.email}
          </Text>
          <SocialLinkButtons links={user.socialLinks} />
        </Box>
        <Flex direction="row" spacing={1}>
          <StatusChip value={presenceStatus(user)} />
          <StatusChip value={userStatus(user)} />
        </Flex>
      </Flex>

      <Divider sx={{ my: 2 }} />

      <DetailFactGrid>
        <DetailFact label="Department">{user.department ?? '—'}</DetailFact>
        <DetailFact label="Designation">{user.designation ?? '—'}</DetailFact>
        <DetailFact label="Reports to">{user.managerName ?? '—'}</DetailFact>
        <DetailFact label="Employment">
          <StatusChip value={user.employmentStatus} />
        </DetailFact>
        <DetailFact label="Joined">{joined}</DetailFact>
        <DetailFact label="Probation ends">{probationEnds}</DetailFact>
        <DetailFact label="Phone">
          {user.phone ? <Link href={`tel:${user.phone}`}>{user.phone}</Link> : '—'}
        </DetailFact>
        <DetailFact label="Last active">{lastActive}</DetailFact>
      </DetailFactGrid>

      <Divider sx={{ my: 2 }} />

      <WorkArrangementFacts arrangement={user} showProfile />

      <Divider sx={{ my: 2 }} />

      <DetailFact label="Roles">
        <Flex direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
          {user.roles.map((role) => (
            <StatusChip key={role} value={role} />
          ))}
        </Flex>
      </DetailFact>

      {user.isBlocked && user.blockReason && (
        <Box sx={{ mt: 2 }}>
          <DetailFact label="Block reason">{user.blockReason}</DetailFact>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <DetailFactGrid>
        <DetailFact label="Created">{formatDateTime(user.createdAt)}</DetailFact>
        <DetailFact label="Last updated">{formatDateTime(user.updatedAt)}</DetailFact>
      </DetailFactGrid>
    </Paper>
  );
}
