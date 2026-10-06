import { cmsComponent } from "@exyconn/cms";

/** A catalogue component's default props: the copy a migrated page was seeded with. */
export function cmsDefaults<T>(key: string): T {
  const component = cmsComponent(key);
  if (!component) {
    throw new Error(`No CMS component "${key}".`);
  }
  return component.defaultProps as T;
}
