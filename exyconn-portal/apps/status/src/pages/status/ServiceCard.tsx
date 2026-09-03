import { Box, Divider, Flex, Link, Typography } from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import { TIME_FORMAT } from '../../status.constants';
import { StateChip } from './StateChip';
import { UptimeBars } from './UptimeBars';
import type { StatusService } from './status.types';

interface ServiceCardProps {
  service: StatusService;
  /** Divider above every row but the first, so the group reads as one card. */
  divided: boolean;
}

/** One monitored service: what it is, how it is doing now, and its day-by-day history. */
export function ServiceCard({ service, divided }: Readonly<ServiceCardProps>) {
  const checkedAt = formatWith(service.lastCheckedAt, TIME_FORMAT);
  const uptimeLine = checkedAt ? `Last checked ${checkedAt}` : 'Not checked yet';
  // Before the first probe every number would read as a hard zero, which looks like an
  // outage rather than "no data", so the figures wait for a measurement.
  const figures = checkedAt ? `${service.uptime30d.toFixed(1)}% · ${service.responseMs} ms` : '';

  return (
    <Box>
      {divided && <Divider />}
      <Box sx={{ py: 2 }}>
        <Flex
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Link
              href={service.url}
              target="_blank"
              rel="noopener"
              underline="hover"
              variant="subtitle1"
              fontWeight={700}
              color="text.primary"
            >
              {service.name}
            </Link>
            <Typography variant="body2" color="text.secondary">
              {service.description}
            </Typography>
          </Box>
          <Flex alignItems="center" spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {figures}
            </Typography>
            <StateChip state={service.state} />
          </Flex>
        </Flex>

        <UptimeBars days={service.days} />

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {uptimeLine}
          {service.lastError ? ` · ${service.lastError}` : ''}
        </Typography>
      </Box>
    </Box>
  );
}
