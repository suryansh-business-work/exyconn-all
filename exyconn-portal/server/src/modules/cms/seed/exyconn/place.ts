import { cmsComponent, componentPlaceholder } from '@exyconn/cms';

/**
 * A catalogue component placed in a seeded page with that page's own props (and the HTML of
 * the children dropped inside it). Throws for a key the catalogue does not have, so a seed
 * that names a missing component fails the build's checks instead of rendering nothing.
 */
export function place(key: string, props: Record<string, unknown>, childrenHtml = ''): string {
  if (!cmsComponent(key)) {
    throw new Error(`The CMS seed places "${key}", which is not in the component catalogue.`);
  }
  return componentPlaceholder(key, props, childrenHtml);
}
