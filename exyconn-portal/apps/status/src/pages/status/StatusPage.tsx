import { Alert, Box, CircularProgress, Flex, Typography } from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useStatusOverviewQuery, type StatusCategory } from '@exyconn/shell/graphql/generated';
import { CATEGORY_LABELS, CATEGORY_ORDER, HISTORY_DAYS, REFRESH_MS } from '../../status.constants';
import { OverallBanner } from './OverallBanner';
import { StatusStats } from './StatusStats';
import { StatusCharts } from './StatusCharts';
import { ServiceGroup } from './ServiceGroup';
import { IncidentList } from './IncidentList';
import type { StatusService } from './status.types';

/** Groups the flat service list into the page's sections, dropping empty categories. */
function groupByCategory(services: StatusService[]) {
  return CATEGORY_ORDER.map((category: StatusCategory) => ({
    category,
    services: services.filter((service) => service.category === category),
  })).filter((group) => group.services.length > 0);
}

/**
 * The public status page: overall state, the day-by-day numbers behind it, every
 * monitored service and the recent incidents. Polls so a page left open stays current.
 */
export function StatusPage() {
  const { data, loading, error } = useStatusOverviewQuery({
    variables: { days: HISTORY_DAYS },
    pollInterval: REFRESH_MS,
  });

  if (loading && !data) {
    return (
      <Flex justifyContent="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Flex>
    );
  }

  if (error || !data) {
    return <Alert severity="error">{errorMessage(error, 'Could not load the status page')}</Alert>;
  }

  const overview = data.statusOverview;

  return (
    <Flex direction="column" spacing={4}>
      <OverallBanner overview={overview} />
      <StatusStats overview={overview} />
      <StatusCharts daily={overview.daily} />

      <Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Services · last {HISTORY_DAYS} days
        </Typography>
        {groupByCategory(overview.services).map((group) => (
          <ServiceGroup
            key={group.category}
            title={CATEGORY_LABELS[group.category]}
            services={group.services}
          />
        ))}
      </Box>

      <Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Recent incidents
        </Typography>
        <IncidentList incidents={overview.incidents} />
      </Box>
    </Flex>
  );
}
