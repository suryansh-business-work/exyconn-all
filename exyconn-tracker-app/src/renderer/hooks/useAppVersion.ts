import { useEffect, useState } from 'react';

/**
 * The version this install is running.
 *
 * Read once — a running app cannot change its own version underneath itself. Shown in About so
 * "which build am I on" is answerable without asking anybody, which is the question behind
 * every report that an update did or did not land.
 */
export default function useAppVersion(): string {
  const [version, setVersion] = useState('');

  useEffect(() => {
    let active = true;
    window.tracker
      .getAppVersion()
      .then((value) => {
        if (active) {
          setVersion(value);
        }
      })
      .catch((error: unknown) => console.error('Could not read the app version', error));
    return () => {
      active = false;
    };
  }, []);

  return version;
}
