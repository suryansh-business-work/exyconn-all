import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Flex, Grid, Heading, Text } from '@/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGetUserQuery } from '@/graphql/generated';
import { UserProfileCard } from './UserProfileCard';
import { UserActions } from './UserActions';
import { EmployeeLeavePanel } from './EmployeeLeavePanel';
import { EmployeeAttendancePanel } from './EmployeeAttendancePanel';
import { EmployeeLeaveBalancePanel } from './EmployeeLeaveBalancePanel';
import { EmployeeEarningsPanel } from './EmployeeEarningsPanel';
import { EmployeeLocationsPanel } from './employee-locations';
import { EmployeeActivityPanel } from './EmployeeActivityPanel';
import { portalLogger } from '@/logging/portalLogger';
import { DetailSkeleton } from '@/components/feedback/skeletons';

/** Dedicated employee details screen with administrative actions. */
export function UserDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Served by two apps: Admin (/admin/users/:id) and HR (/hr/employees/:id).
  const fromHr = pathname.startsWith('/hr');
  const backTo = fromHr ? '/hr/employees' : '/admin/users';
  const { data, loading, error, refetch } = useGetUserQuery({
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
  const user = data?.getUser;

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        color="inherit"
        onClick={() => navigate(backTo)}
        sx={{ mb: 2 }}
      >
        {fromHr ? 'Back to employee records' : 'Back to users'}
      </Button>

      {loading && !user && <DetailSkeleton />}

      {error && <Text color="error">{error.message || 'Failed to load user.'}</Text>}

      {user && (
        <>
          <Flex
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            flexWrap="wrap"
            sx={{ mb: 2 }}
          >
            <Heading level={4}>Employee details</Heading>
            <UserActions
              user={user}
              onChanged={() => {
                refetch().catch((err: unknown) =>
                  portalLogger.warn('Could not reload the employee', err),
                );
              }}
              editPath={fromHr ? `/hr/employees/${user.id}/edit` : undefined}
            />
          </Flex>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <UserProfileCard user={user} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <EmployeeLeaveBalancePanel employeeId={user.id} />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 7,
              }}
            >
              <EmployeeLeavePanel employeeId={user.id} />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 5,
              }}
            >
              <EmployeeAttendancePanel employeeId={user.id} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <EmployeeEarningsPanel employeeId={user.id} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <EmployeeLocationsPanel employeeId={user.id} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <EmployeeActivityPanel employeeId={user.id} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
