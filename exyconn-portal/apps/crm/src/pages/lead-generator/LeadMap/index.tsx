import { lazy, Suspense } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Stack } from '@exyconn/shell/components/ui';
import { MapSkeleton } from '@exyconn/shell/components/maps';
import { DrawAreaControls } from './DrawAreaControls';
import type { LeadMapProps } from './LeadMapBody';
import { MapKeyMissing } from './MapNotices';

// Maps JavaScript and @react-google-maps/api download only when this page opens.
const LeadMapBody = lazy(() => import('./LeadMapBody'));

type LeadMapShellProps = Omit<LeadMapProps, 'apiKey'> & {
  /** The Maps JavaScript key, or null when Tech has not saved one. */
  apiKey: string | null;
  mapReady: boolean;
};

/**
 * The lead generator's map, lazily loaded, in a box that stays in view beside the list. The
 * box keeps its size whatever it shows: the map, its loading state, or why there is no map.
 */
export function LeadMap({ apiKey, mapReady, ...props }: Readonly<LeadMapShellProps>) {
  const t = useT();
  return (
    <Stack
      spacing={1}
      role="region"
      aria-label={t('Map of the businesses found')}
      sx={{
        height: { xs: 360, sm: 440, md: 'calc(100vh - 220px)' },
        minHeight: 320,
        position: { md: 'sticky' },
        top: { md: 16 },
      }}
    >
      {apiKey && props.drawEnabled && <DrawAreaControls area={props.area} mapReady={mapReady} />}
      <Box sx={{ flex: 1, minHeight: 0, borderRadius: 1, overflow: 'hidden' }}>
        {apiKey ? (
          <Suspense fallback={<MapSkeleton height="100%" />}>
            <LeadMapBody apiKey={apiKey} {...props} />
          </Suspense>
        ) : (
          <MapKeyMissing />
        )}
      </Box>
    </Stack>
  );
}
