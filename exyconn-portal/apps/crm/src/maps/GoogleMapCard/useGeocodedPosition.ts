import { useEffect, useState } from 'react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';

type Lookup =
  | { status: 'idle' | 'loading' | 'missing' }
  | { status: 'found'; position: google.maps.LatLngLiteral };

/**
 * Finds an address on the map with the Maps JavaScript Geocoder, once the script is loaded.
 * Runs only when there are no stored coordinates; an address Google cannot place is "missing".
 */
export function useGeocodedPosition(address: string, enabled: boolean): Lookup {
  const [lookup, setLookup] = useState<Lookup>({ status: 'idle' });
  useEffect(() => {
    if (!enabled || address === '') {
      return undefined;
    }
    let live = true;
    setLookup({ status: 'loading' });
    new google.maps.Geocoder()
      .geocode({ address })
      .then(({ results }) => {
        const location = results[0]?.geometry.location;
        if (live) {
          setLookup(
            location ? { status: 'found', position: location.toJSON() } : { status: 'missing' },
          );
        }
      })
      .catch((error: unknown) => {
        portalLogger.warn('crm: geocoding an address for the map failed', error);
        if (live) {
          setLookup({ status: 'missing' });
        }
      });
    return () => {
      live = false;
    };
  }, [address, enabled]);
  return lookup;
}
