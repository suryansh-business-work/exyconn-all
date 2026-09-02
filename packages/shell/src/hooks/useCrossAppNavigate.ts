import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { appOrigin, type PortalAppKey } from '@/config/apps';
import { env } from '@/config/env';

/**
 * Navigation that spans micro-frontends: a client-side route change when the
 * target lives in this app, a full page load when it belongs to another one.
 */
export function useCrossAppNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (app: PortalAppKey, path: string) => {
      if (app === env.portalApp) {
        navigate(path);
        return;
      }
      window.location.assign(`${appOrigin(app)}${path}`);
    },
    [navigate],
  );
}
