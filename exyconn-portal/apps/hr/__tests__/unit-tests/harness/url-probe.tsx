import { useCurrentUrl } from '../test-utils';

/** Prints the router's current URL, so a test can see where a screen navigated. */
export function UrlProbe() {
  const url = useCurrentUrl();
  return <output aria-label="current url">{url}</output>;
}
