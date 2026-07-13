import { Box, Chip, Divider, Grid, Flex, Heading, Text } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { glass } from '@/components/glass/glass';
import { useAuth } from '@/auth/AuthContext';
import { AvatarUploader } from './AvatarUploader';
import { ProfileForm } from './forms/profile';

/** Self-service profile page: avatar upload, identity overview and name edit. */
export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Box>
      <PageHeader title="My Profile" subtitle="Manage your photo and personal details" />
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Box sx={[glass, { p: 3, textAlign: 'center' }]}>
            <AvatarUploader />
            <Heading level={6} sx={{ mt: 2 }}>
              {user.name}
            </Heading>
            <Text size="sm" color="text.secondary">
              {user.email}
            </Text>
            <Divider sx={{ my: 2 }} />
            <Text size="caption" color="text.secondary">
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
              {user.roles.map((role) => (
                <Chip key={role} label={role} size="small" />
              ))}
            </Flex>
          </Box>
        </Grid>
        <Grid item xs={12} md={8}>
          <Box sx={[glass, { p: 3 }]}>
            <Heading level={6} sx={{ mb: 2 }}>
              Personal details
            </Heading>
            <ProfileForm />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
