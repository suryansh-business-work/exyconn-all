import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, CircularProgress, Flex, Paper, Text } from '@exyconn/shell/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useGetUserQuery } from '@exyconn/shell/graphql/generated';
import { UserForm, type UserRow } from '@exyconn/shell/pages/user-forms/user';

const RECORDS_PATH = '/hr/employees';

/**
 * The employee record, on a page of its own rather than in a dialog.
 *
 * The record is no longer four fields: it carries a photo, an address, a brief, and the
 * working arrangement the tracker measures every day against. That does not belong in a
 * modal — it is long enough to scroll, and losing it to a stray click outside would be a
 * real loss of work. Serves both `/hr/employees/new` and `/hr/employees/:id/edit`.
 */
export function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { data, loading, error } = useGetUserQuery({
    variables: { id: id ?? '' },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const initial = (data?.getUser ?? null) as UserRow | null;
  const done = () => navigate(isEdit ? `${RECORDS_PATH}/${id}` : RECORDS_PATH);

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        color="inherit"
        onClick={() => navigate(RECORDS_PATH)}
        sx={{ mb: 2 }}
      >
        Back to employee records
      </Button>

      <PageHeader
        title={isEdit ? 'Edit employee' : 'New employee'}
        subtitle={
          isEdit
            ? 'Changes to the working arrangement reach the desktop tracker within a minute.'
            : 'Creates the account and emails a temporary password.'
        }
      />

      <Paper sx={[glass, { p: { xs: 2, md: 3 } }]}>
        {loading && !initial && (
          <Flex direction="column" alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Flex>
        )}
        {error && <Text color="error">{error.message || 'Failed to load the employee.'}</Text>}
        {(!isEdit || initial) && (
          <UserForm initial={initial} onDone={done} onCancel={() => navigate(RECORDS_PATH)} />
        )}
      </Paper>
    </Box>
  );
}
