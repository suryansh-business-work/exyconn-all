import { Box, Grid, Heading } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { readingPanel } from '@/components/glass/glass';
import { useAuth } from '@/auth/AuthContext';
import { useMeQuery } from '@/graphql/generated';
import { ProfileSummaryCard } from './ProfileSummaryCard';
import { ProfileForm } from './forms/profile';

/** Self-service profile page: how colleagues see you on the left, what you can change on the right. */
export function ProfilePage() {
  const { user } = useAuth();
  const { data } = useMeQuery({ fetchPolicy: 'cache-and-network' });
  if (!user) return null;

  return (
    <Box>
      <PageHeader
        title="My Profile"
        subtitle="Your photo, bio, contact details and the profiles you share"
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ProfileSummaryCard
            name={user.name}
            email={user.email}
            roles={user.roles}
            me={data?.me}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={readingPanel}>
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
