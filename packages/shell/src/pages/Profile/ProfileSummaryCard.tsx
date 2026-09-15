import { Box, Chip, Divider, Flex, Heading, Text } from '@/components/ui';
import { readingPanel } from '@/components/glass/glass';
import { StatusChip } from '@/components/data/StatusChip';
import { SocialLinkButtons } from '@/components/profile/SocialLinkButtons';
import { AvatarUploader } from './AvatarUploader';
import { presenceStatus } from '../UserDetails/user-details.types';
import type { ProfileMe } from './forms/profile';

interface ProfileSummaryCardProps {
  name: string;
  email: string;
  roles: readonly string[];
  me: ProfileMe | undefined;
}

/** How colleagues see the person: photo, presence, role in the company, bio and links. */
export function ProfileSummaryCard({ name, email, roles, me }: Readonly<ProfileSummaryCardProps>) {
  const online = me?.isOnline ?? true;
  const role = [me?.designation, me?.department].filter(Boolean).join(' · ');

  return (
    <Box sx={[readingPanel, { textAlign: 'center' }]}>
      <AvatarUploader online={online} />
      <Heading level={6} sx={{ mt: 2 }}>
        {name}
      </Heading>
      {role && (
        <Text size="sm" color="text.secondary" sx={{ display: 'block' }}>
          {role}
        </Text>
      )}
      <Text size="sm" color="text.secondary" sx={{ display: 'block', overflowWrap: 'anywhere' }}>
        {email}
      </Text>
      <Flex direction="row" justifyContent="center" sx={{ mt: 1.5 }}>
        <StatusChip value={presenceStatus({ isOnline: online })} />
      </Flex>
      {me?.brief && (
        <Text size="sm" sx={{ display: 'block', mt: 2, whiteSpace: 'pre-line' }}>
          {me.brief}
        </Text>
      )}
      <Box sx={{ mt: 1.5 }}>
        <SocialLinkButtons links={me?.socialLinks} justifyContent="center" />
      </Box>
      <Divider sx={{ my: 2 }} />
      <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
        Roles
      </Text>
      <Flex
        direction="row"
        spacing={0.5}
        flexWrap="wrap"
        useFlexGap
        justifyContent="center"
        sx={{ mt: 1 }}
      >
        {roles.map((r) => (
          <Chip key={r} label={r} size="small" />
        ))}
      </Flex>
    </Box>
  );
}
