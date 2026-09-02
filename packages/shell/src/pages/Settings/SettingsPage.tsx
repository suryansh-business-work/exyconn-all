import { Box, Grid, Heading, Text } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { glass } from '@/components/glass/glass';
import { ChangePasswordForm } from './forms/change-password';

/** Account settings page — currently houses the change-password form. */
export function SettingsPage() {
  return (
    <Box>
      <PageHeader title="Settings" subtitle="Manage your account security" />
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Box sx={[glass, { p: 3 }]}>
            <Heading level={6} sx={{ mb: 0.5 }}>
              Change password
            </Heading>
            <Text size="sm" color="text.secondary" sx={{ mb: 2 }}>
              Use a strong password you don't use elsewhere.
            </Text>
            <ChangePasswordForm />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
