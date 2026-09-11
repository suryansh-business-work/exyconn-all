import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Card, Flex, Typography } from '@exyconn/shell/components/ui';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import { useStatusOverviewQuery } from '@exyconn/shell/graphql/generated';
import { ReportProblemForm } from './forms/report-problem';
import { CheckReportForm } from './forms/check-report';
import { ReportReceipt } from './ReportReceipt';

/**
 * Public "report a problem" page. The service list comes from the same overview the
 * status page reads, so a reporter can only pick something we actually monitor.
 */
export function ReportPage() {
  const navigate = useNavigate();
  const [reference, setReference] = useState('');
  // One day of history is enough here: the form only needs the service names.
  const { data } = useStatusOverviewQuery({ variables: { days: 1 } });

  const services: SelectOption[] = (data?.statusOverview.services ?? []).map((service) => ({
    value: service.key,
    label: service.name,
  }));

  if (reference) {
    return <ReportReceipt reference={reference} onAnother={() => setReference('')} />;
  }

  return (
    <Flex direction="column" spacing={3}>
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
          }}
        >
          Report a problem
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
          }}
        >
          Tell us what broke and our tech team picks it up directly. You do not need an account, and
          you will get a reference to quote if you follow it up.
        </Typography>
      </Box>

      <Alert severity="info">
        Checking the service list first is worth a moment — if it is already showing a disruption,
        we are on it.
      </Alert>

      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <ReportProblemForm
          services={services}
          onSubmitted={setReference}
          onCancel={() => navigate('/')}
        />
      </Card>

      <Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          Check a report
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          Already reported something? Quote the reference from your receipt to see where it is.
        </Typography>
      </Box>
      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <CheckReportForm onCancel={() => navigate('/')} />
      </Card>
    </Flex>
  );
}
