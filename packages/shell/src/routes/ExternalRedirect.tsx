import { useEffect } from 'react';

/** Full-page redirect to another portal app, which is a different origin. */
export function ExternalRedirect({ to }: Readonly<{ to: string }>) {
  useEffect(() => {
    globalThis.location.replace(to);
  }, [to]);
  return null;
}
