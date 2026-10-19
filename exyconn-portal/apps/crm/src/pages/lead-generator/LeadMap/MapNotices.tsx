import { useT } from '@exyconn/i18n';
import { Link } from '@exyconn/shell/components/ui';
import { appUrl } from '@exyconn/shell/config/apps';
import { TECH_GOOGLE_MAPS_PATH } from '../PlacesNotConfigured';
import { MapNotice } from './MapNotice';

/** Tech has saved a Places key but no Maps JavaScript key, so there is no map to draw on. */
export function MapKeyMissing() {
  const t = useT();
  return (
    <MapNotice tone="info" title={t('The map needs a Maps JavaScript key')}>
      {t(
        'Ask Tech to add a Maps JavaScript key, restricted to the CRM’s HTTP referrers and with the Maps JavaScript API enabled, in',
      )}{' '}
      <Link href={appUrl('tech', TECH_GOOGLE_MAPS_PATH)}>
        {t('Tech > Environment Variables > Google Maps')}
      </Link>
      .{' '}
      {t(
        'Searching a place still works; searching around the map centre or inside a drawn area needs the map.',
      )}
    </MapNotice>
  );
}

/** Google refused the key (gm_authFailure): almost always the referrer list or a disabled API. */
export function MapKeyRejected() {
  const t = useT();
  // The page's own origin is what the key's referrer list must allow.
  const referrer = `${globalThis.location.origin}/*`;
  return (
    <MapNotice tone="error" title={t('Google rejected the Maps key')}>
      {t(
        'Check that its HTTP referrer restrictions include {referrer} and that the Maps JavaScript API is enabled.',
        { referrer },
      )}
    </MapNotice>
  );
}

/** The Maps JavaScript script itself did not load (offline, blocked, or a bad key). */
export function MapLoadFailed() {
  const t = useT();
  return (
    <MapNotice tone="error" title={t('Google Maps could not be loaded')}>
      {t(
        'Check your connection and any ad or script blocker, then reload. If it keeps failing, ask Tech to check the Maps JavaScript key.',
      )}
    </MapNotice>
  );
}
