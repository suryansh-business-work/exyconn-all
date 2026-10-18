import { Navigate, useLocation } from 'react-router-dom';

const LEGACY_PREFIX = '/crm';

/**
 * CRM pages lived under /crm before the subdomain was enough; a saved link, a bookmark or an
 * old notification still opens the same page at its address without the prefix.
 */
export function LegacyCrmRedirect() {
  const { pathname, search, hash } = useLocation();
  const path = pathname.slice(LEGACY_PREFIX.length) || '/';
  return <Navigate to={`${path}${search}${hash}`} replace />;
}
