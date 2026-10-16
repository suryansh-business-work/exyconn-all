import { lazy, Suspense } from 'react';
import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { MapSkeleton } from '../../../maps/MapSkeleton';
import type { LeadMapProps } from './LeadMapBody';

// Maps JavaScript and @react-google-maps/api download only when this page opens.
const LeadMapBody = lazy(() => import('./LeadMapBody'));

/** The lead generator's map, lazily loaded, in a box that stays in view beside the list. */
export function LeadMap(props: Readonly<LeadMapProps>) {
  const t = useT();
  return (
    <Box
      role="region"
      aria-label={t('Map of the businesses found')}
      sx={{
        height: { xs: 320, md: 'calc(100vh - 220px)' },
        minHeight: 320,
        position: { md: 'sticky' },
        top: { md: 16 },
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Suspense fallback={<MapSkeleton height="100%" />}>
        <LeadMapBody {...props} />
      </Suspense>
    </Box>
  );
}
