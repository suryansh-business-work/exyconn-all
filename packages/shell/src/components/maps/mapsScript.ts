import { useSyncExternalStore } from 'react';
import { useJsApiLoader, type Libraries } from '@react-google-maps/api';
import { portalLogger } from '@/logging/portalLogger';

/**
 * The one Maps JavaScript loader every portal map uses. Every map passes the same id and libraries, which
 * the loader requires: the script is added to the page once and shared. Only the core library is
 * loaded — markers, polygons and the Geocoder are part of it. This module (and
 * @react-google-maps/api) is only ever reached through a lazy import, so the main bundle does not
 * carry it.
 */
const LIBRARIES: Libraries = [];

/**
 * Google calls `gm_authFailure` when it rejects the key (wrong HTTP referrer, Maps JavaScript
 * API not enabled, billing off). The script still "loads", so without this the map is a grey box.
 */
type MapsGlobal = typeof globalThis & { gm_authFailure?: () => void };

let authFailed = false;
const listeners = new Set<() => void>();

(globalThis as MapsGlobal).gm_authFailure = () => {
  authFailed = true;
  portalLogger.error('maps: Google rejected the Maps JavaScript key');
  for (const listener of listeners) {
    listener();
  }
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const readAuthFailed = () => authFailed;

export function useMapsScript(apiKey: string) {
  const loader = useJsApiLoader({
    id: 'exyconn-google-maps',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });
  const rejected = useSyncExternalStore(subscribe, readAuthFailed);
  return { ...loader, authFailed: rejected };
}
