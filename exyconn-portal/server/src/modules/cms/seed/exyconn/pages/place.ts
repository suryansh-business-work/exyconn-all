import { cmsComponent, componentPlaceholder } from '@exyconn/cms';

/**
 * A catalogue component placed in a seeded page: with the page's own props, or with its
 * catalogue defaults when those are the page's copy (`props` omitted). Children are the HTML
 * of the components dropped inside a container.
 */
export function place(key: string, props?: Record<string, unknown>, childrenHtml = ''): string {
  const component = cmsComponent(key);
  if (!component) {
    throw new Error(`The CMS seed places "${key}", which is not in the component catalogue.`);
  }
  return componentPlaceholder(key, props ?? component.defaultProps, childrenHtml);
}
