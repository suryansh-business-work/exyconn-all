import { useT } from '@exyconn/i18n';
import { Alert, Link } from '@exyconn/shell/components/ui';
import { appUrl } from '@exyconn/shell/config/apps';
import { TECH_GOOGLE_MAPS_PATH } from '@exyconn/shell/components/maps';

/** Tech has not saved a Places key yet, so nothing can be searched. */
export function PlacesNotConfigured() {
  const t = useT();
  return (
    <Alert severity="info">
      {t('Google Places is not set up yet. Ask Tech to add the Google Maps keys in')}{' '}
      <Link href={appUrl('tech', TECH_GOOGLE_MAPS_PATH)}>
        {t('Tech > Environment Variables > Google Maps')}
      </Link>
      .
    </Alert>
  );
}
