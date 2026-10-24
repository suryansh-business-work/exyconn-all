import { Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import { EXTENSION_VERSION } from '../config';

/** The installed build's version, so people (and support) can tell which one they run. */
export function VersionText() {
  const t = useT();
  return (
    <Typography variant="caption" color="text.secondary">
      {t('Version {version}', { version: EXTENSION_VERSION })}
    </Typography>
  );
}
