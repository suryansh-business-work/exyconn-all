import { useState } from 'react';
import { Box, Grid } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import PeopleIcon from '@mui/icons-material/People';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { BillingRangePicker } from './BillingRangePicker';
import { TrackerBillingEmployees } from './TrackerBillingEmployees';
import { TrackerBillingByProject } from './TrackerBillingByProject';
import { monthRange } from './tracker.billing';

/**
 * What the workspace's tracked time is worth — per employee, or per project against its
 * budget. Hours are ACTIVE time plus approved off-computer time, and every rate comes from
 * HR; which view is open lives in the URL so a link to it opens on it.
 */
export function TrackerBillingPage() {
  const [range, setRange] = useState(monthRange);

  const tabs: TabberItem[] = [
    {
      slug: 'employees',
      label: 'By employee',
      icon: <PeopleIcon />,
      content: <TrackerBillingEmployees range={range} />,
    },
    {
      slug: 'projects',
      label: 'By project',
      icon: <AccountTreeIcon />,
      content: <TrackerBillingByProject range={range} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Billing"
        subtitle="Tracked hours priced at each employee's billing rate from HR"
      />
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <BillingRangePicker range={range} onChange={setRange} />
      </Grid>
      <Tabber basePath="/tracker/billing" items={tabs} ariaLabel="Billing views" />
    </Box>
  );
}
