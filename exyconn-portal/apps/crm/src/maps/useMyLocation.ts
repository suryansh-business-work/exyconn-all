import { useCallback, useState } from 'react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { LatLng } from './mapLinks';

/** How long the browser may take to find the reader, and how old a cached fix may be. */
const POSITION_OPTIONS: PositionOptions = { timeout: 15_000, maximumAge: 60_000 };

/** Why the browser gave no position, as a sentence for the reader (the English is the i18n key). */
function reasonOf(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Location access is blocked. Allow it for this site in the browser, then try again.';
  }
  if (error.code === error.TIMEOUT) {
    return 'Finding your location took too long. Try again.';
  }
  return 'Your location could not be found. Try again, or enter the coordinates.';
}

/**
 * The reader's position from the browser (navigator.geolocation), asked for on demand. A
 * failure is explained and logged without coordinates, which are personal data.
 */
export function useMyLocation() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('This browser cannot share its location. Enter the coordinates instead.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      (failure) => {
        portalLogger.warn('crm: browser location unavailable', { code: failure.code });
        setError(reasonOf(failure));
        setLocating(false);
      },
      POSITION_OPTIONS,
    );
  }, []);

  return { position, locating, error, locate };
}
