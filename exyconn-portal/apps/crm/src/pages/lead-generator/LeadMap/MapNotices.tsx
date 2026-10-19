import { useT } from '@exyconn/i18n';
import { Link } from '@exyconn/shell/components/ui';
import { appUrl } from '@exyconn/shell/config/apps';
import { MapNotice, TECH_GOOGLE_MAPS_PATH } from '@exyconn/shell/components/maps';

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
