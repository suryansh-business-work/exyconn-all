import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, CircularProgress, Flex, Grid, Heading, Text } from '@/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGetUserQuery } from '@/graphql/generated';
import { UserProfileCard } from './UserProfileCard';
import { UserActions } from './UserActions';
import { EmployeeLeavePanel } from './EmployeeLeavePanel';
import { EmployeeAttendancePanel } from './EmployeeAttendancePanel';

/** Dedicated employee details screen with administrative actions. */
export function UserDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Served by two apps: Admin (/admin/users/:id) and HR (/hr/employees/:id).
  const fromHr = pathname.startsWith('/hr');
  const backTo = fromHr ? '/hr/employees' : '/admin';
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

      {loading && !user && (
        <Flex direction="column" alignItems="center" sx={{ py: 6 }}>
          <CircularProgress />
        </Flex>
      )}

      {error && <Text color="error">{error.message || 'Failed to load user.'}</Text>}

      {user && (
        <>
          <Heading level={4} sx={{ mb: 2 }}>
            Employee details
          </Heading>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <UserProfileCard user={user} />
            </Grid>
            <Grid item xs={12} md={5}>
              <UserActions
                user={user}
                onChanged={() => void refetch()}
                editPath={fromHr ? `/hr/employees/${user.id}/edit` : undefined}
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <EmployeeLeavePanel employeeId={user.id} />
            </Grid>
            <Grid item xs={12} md={5}>
              <EmployeeAttendancePanel employeeId={user.id} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
