import { lazy, Suspense } from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useT } from '@exyconn/i18n';
import { Link, Stack, Text } from '@exyconn/shell/components/ui';
import { MapSkeleton } from '@exyconn/shell/components/maps';
import { useGoogleMapsClientConfigQuery } from '@exyconn/shell/graphql/generated';
import { googleMapsLink, positionOf, type MapTarget } from '../mapLinks';

// Maps JavaScript and @react-google-maps/api download only when a map is actually shown.
const MapCardBody = lazy(() => import('./MapCardBody'));

interface GoogleMapCardProps {
  target: MapTarget;
  /** The marker's title and the map's accessible name. */
  title: string;
}

/**
 * Where a company or contact is, on a small map with "Open in Google Maps". Stored coordinates
 * are used when present, else the address is geocoded in the browser. Renders nothing when there
 * is nothing to place or no Maps key is configured (Tech > Environment Variables > Google Maps).
 */
export function GoogleMapCard({ target, title }: Readonly<GoogleMapCardProps>) {
  const t = useT();
  // A country alone is no place to put a pin: a street or a city is needed to geocode.
  const placeable =
    positionOf(target) !== null || Boolean(target.address?.trim() || target.city?.trim());
  const { data } = useGoogleMapsClientConfigQuery({ skip: !placeable });
  const apiKey = data?.googleMapsClientConfig.browserKey;
  if (!placeable || !apiKey) {
    return null;
  }
  return (
    <Stack spacing={1}>
      <Text component="h2" size="label" weight="bold">
        {t('Map')}
      </Text>
      <Suspense fallback={<MapSkeleton height={200} />}>
        <MapCardBody apiKey={apiKey} target={target} title={title} />
      </Suspense>
      <Link
        href={googleMapsLink(target)}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
      >
        {t('Open in Google Maps')}
        <OpenInNewIcon fontSize="inherit" aria-hidden />
      </Link>
    </Stack>
  );
}
