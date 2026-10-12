import { cmsComponent, componentPlaceholder } from '@exyconn/cms';

/** A catalogue component's default props. Throws for a key the catalogue does not have. */
export function defaultsOf(key: string): Record<string, unknown> {
  const component = cmsComponent(key);
  if (!component) {
    throw new Error(`The CMS seed places "${key}", which is not in the component catalogue.`);
  }
  return component.defaultProps;
}

/**
 * A catalogue component placed in a seeded page: with the page's own props, or with its
 * catalogue defaults when those are the page's copy (`props` omitted). Children are the HTML
 * of the components dropped inside a container.
 */
export function place(key: string, props?: Record<string, unknown>, childrenHtml = ''): string {
  const defaults = defaultsOf(key);
  return componentPlaceholder(key, props ?? defaults, childrenHtml);
}
