import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import { MapSkeleton } from '../MapSkeleton';
import { useMapsScript } from '../mapsScript';
import { addressText, positionOf, type MapTarget } from '../mapLinks';
import { useGeocodedPosition } from './useGeocodedPosition';

const MAP_HEIGHT = 200;
const STREET_ZOOM = 15;
const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
};

interface MapCardBodyProps {
  apiKey: string;
  target: MapTarget;
  title: string;
}

/** The map itself: loads the script, finds the position, and shows one marker. */
export default function MapCardBody({ apiKey, target, title }: Readonly<MapCardBodyProps>) {
  const t = useT();
  const { isLoaded, loadError } = useMapsScript(apiKey);
  const stored = positionOf(target);
  const lookup = useGeocodedPosition(addressText(target), isLoaded && stored === null);
  const position = stored ?? (lookup.status === 'found' ? lookup.position : null);

  if (loadError || lookup.status === 'missing') {
    return (
      <Text size="caption" color="text.secondary">
        {t('This place could not be shown on the map.')}
      </Text>
    );
  }
  if (!isLoaded || !position) {
    return <MapSkeleton height={MAP_HEIGHT} />;
  }
  return (
    <Box
      role="region"
      aria-label={t('Map of {name}', { name: title })}
      sx={{ height: MAP_HEIGHT, borderRadius: 1, overflow: 'hidden' }}
    >
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={position}
        zoom={STREET_ZOOM}
        options={MAP_OPTIONS}
      >
        <MarkerF position={position} title={title} />
      </GoogleMap>
    </Box>
  );
}
