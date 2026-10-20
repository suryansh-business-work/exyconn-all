/**
 * Google Maps for every portal: the one shared script loader (with Google's key-rejection
 * signal), the map's loading box, and the notices that replace a map that cannot be drawn.
 * `useMapsScript` pulls in @react-google-maps/api, so import it only from a lazily loaded
 * module; everything exported here is safe for the main bundle.
 */
export { MapSkeleton } from './MapSkeleton';
export { MapNotice } from './MapNotice';
export { MapKeyNotSet, MapKeyRejected, MapLoadFailed, TECH_GOOGLE_MAPS_PATH } from './MapNotices';
