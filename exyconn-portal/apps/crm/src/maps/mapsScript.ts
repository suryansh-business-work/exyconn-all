import { useJsApiLoader, type Libraries } from '@react-google-maps/api';

/**
 * The one Maps JavaScript loader the CRM uses. Every map passes the same id and libraries, which
 * the loader requires: the script is added to the page once and shared. Only the core library is
 * loaded — markers and the Geocoder are part of it. This module (and @react-google-maps/api) is
 * only ever reached through a lazy import, so the main bundle does not carry it.
 */
const LIBRARIES: Libraries = [];

export function useMapsScript(apiKey: string) {
  return useJsApiLoader({
    id: 'exyconn-google-maps',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });
}
