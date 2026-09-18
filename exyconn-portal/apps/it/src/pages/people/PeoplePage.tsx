import { useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Box, Grid, Stack, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useItEmployeeProfileQuery } from '@exyconn/shell/graphql/generated';
import { EmployeePicker } from './EmployeePicker';
import { AccessSection, DevicesSection, LicencesSection, RequestsSection } from './ProfileSections';

/** Whether the account can sign in, in one word. */
function accountState(profile: { isActive: boolean; isBlocked: boolean }): string {
  if (!profile.isActive) {
    return 'INACTIVE';
  }
  return profile.isBlocked ? 'BLOCKED' : 'ACTIVE';
}

/**
 * IT › Employee IT Profile: one person as IT sees them — the account, the devices they hold,
 * the software, application, VPN and email access they have, and what is still being done.
 */
export function PeoplePage() {
  const t = useT();
  const { id = '' } = useParams();
  const { formatDateTime } = useSettings();
  const { data, loading, error } = useItEmployeeProfileQuery({
    variables: { employeeId: id },
    skip: id === '',
    fetchPolicy: 'cache-and-network',
  });
  const profile = data?.itEmployeeProfile;

  let body = (
    <Text color="text.secondary">{t('Pick an employee to see their devices and access.')}</Text>
  );
  if (profile) {
    body = (
      <Stack spacing={2}>
        <Box sx={panel}>
          <DetailFactGrid>
            <DetailFact label="Email">{profile.email}</DetailFact>
            <DetailFact label="Department">{profile.department ?? '—'}</DetailFact>
            <DetailFact label="Designation">{profile.designation ?? '—'}</DetailFact>
            <DetailFact label="Account">
              <StatusChip value={accountState(profile)} />
            </DetailFact>
            <DetailFact label="Portal roles">{profile.roles.join(', ')}</DetailFact>
            <DetailFact label="Last active">
              {profile.lastActiveAt ? formatDateTime(profile.lastActiveAt) : '—'}
            </DetailFact>
            <DetailFact label="Open IT tickets">{profile.openTickets}</DetailFact>
          </DetailFactGrid>
        </Box>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <DevicesSection profile={profile} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AccessSection profile={profile} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <LicencesSection profile={profile} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <RequestsSection profile={profile} />
          </Grid>
        </Grid>
      </Stack>
    );
  } else if (error) {
    body = <Text color="error">{error.message}</Text>;
  } else if (loading) {
    body = <Text color="text.secondary">{t('Loading…')}</Text>;
  }

  return (
    <Box>
      <PageHeader
        title={profile ? '{name}' : 'Employee IT Profile'}
        titleValues={profile ? { name: profile.name } : undefined}
        subtitle="Devices, software, access, VPN, email and permissions"
      />
      <Stack spacing={2}>
        <EmployeePicker selectedId={id} />
        {body}
      </Stack>
    </Box>
  );
}
