import { useCallback, useEffect, useState } from 'react';
import type { LocationAccess } from '@exyconn/tracker-core';

export interface LocationAccessCheck {
  access: LocationAccess;
  /** Reads a fix again — after the employee has changed the OS setting. */
  check: () => void;
}

/**
 * Whether this computer can tell the tracker where it is, found the only reliable way: by
 * reading a fix through main, exactly as attendance does. The fix itself is dropped — only
 * whether one came back is kept, and the failure's reason (never a coordinate) is logged.
 */
export default function useLocationAccess(): LocationAccessCheck {
  const [access, setAccess] = useState<LocationAccess>({ status: 'checking' });

  const check = useCallback(() => {
    setAccess({ status: 'checking' });
    globalThis.tracker
      .getLocation()
      .then(() => setAccess({ status: 'on' }))
      .catch((error: unknown) => {
        console.error('Checking location access failed', error);
        setAccess({ status: 'off', reason: 'noFix', canAsk: false });
      });
  }, []);

  useEffect(check, [check]);

  return { access, check };
}
