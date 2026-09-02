import { useLocation } from 'react-router-dom';
import { ExternalRedirect, appOrigin, appForPath, HUB_URL } from '@exyconn/shell';

const LEGACY_PREFIX = '/portal';

/**
 * Keeps bookmarks from the single-SPA era working: `/portal/hr/leave` now lives
 * at `hr.exyconn.com/hr/leave`, so send the visitor to whichever micro-frontend
 * claims that path, and back to the launcher when none does.
 */
export function LegacyModuleRedirect() {
  const { pathname, search } = useLocation();
  const path = pathname.slice(LEGACY_PREFIX.length);
  const app = appForPath(path);
  return <ExternalRedirect to={app ? `${appOrigin(app)}${path}${search}` : HUB_URL} />;
}
