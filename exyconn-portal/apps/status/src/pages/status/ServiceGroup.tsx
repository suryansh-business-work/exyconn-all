import { Box, Card, Typography } from '@exyconn/shell/components/ui';
import { ServiceCard } from './ServiceCard';
import type { StatusService } from './status.types';

interface ServiceGroupProps {
  title: string;
  services: StatusService[];
}

/** One category of services — Portals, APIs, Tools — as a single card. */
export function ServiceGroup({ title, services }: Readonly<ServiceGroupProps>) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>
        {title}
      </Typography>
      <Card variant="outlined" sx={{ px: { xs: 2, md: 3 }, py: 0.5, mt: 0.5 }}>
        {services.map((service, index) => (
          <ServiceCard key={service.key} service={service} divided={index > 0} />
        ))}
      </Card>
    </Box>
  );
}
