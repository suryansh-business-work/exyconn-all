import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { locationTurnOn, type LocationAccess } from '@exyconn/tracker-core';
import { logger } from '../tracker/logger';
import {
  openLocationSettings,
  readLocationAccess,
  requestLocationAccess,
} from '../tracker/location-access';

export interface LocationAccessCheck {
  access: LocationAccess;
  /** "Turn on": the OS prompt, or this app's settings page once the OS will not ask again. */
  turnOn: () => Promise<void>;
  openSettings: () => Promise<void>;
}

/**
 * Location access on this phone, read at mount and again whenever the app comes back to the
 * foreground — the employee may have just flipped the switch in Settings.
 */
export function useLocationAccess(): LocationAccessCheck {
  const [access, setAccess] = useState<LocationAccess>({ status: 'checking' });

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setAccess(await readLocationAccess());
    } catch (error: unknown) {
      logger.error('Checking location access failed', error);
      setAccess({ status: 'off', reason: 'noFix', canAsk: false });
    }
  }, []);

  useEffect(() => {
    const check = (): void => {
      refresh().catch((error: unknown) => logger.error('Checking location access failed', error));
    };
    check();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        check();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  const turnOn = useCallback(async (): Promise<void> => {
    if (locationTurnOn(access) === 'request') {
      await requestLocationAccess();
      await refresh();
      return;
    }
    await Linking.openSettings();
  }, [access, refresh]);

  return { access, turnOn, openSettings: openLocationSettings };
}
