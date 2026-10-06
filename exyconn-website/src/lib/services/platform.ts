/**
 * The Exyconn infrastructure platform (/exyconn-services): how its services are grouped and
 * counted. The services, categories and every word are the CMS page's props
 * ('company.platform-hub'); the counts on the page are derived from that list, so the copy
 * cannot drift.
 */
export type PlatformStatus = "live" | "dev" | "soon";

export interface PlatformService {
  id: string;
  name: string;
  description: string;
  status: PlatformStatus;
  category: string;
  features: readonly string[];
}

/** What each status is called on the page. */
export type PlatformStatusLabels = Readonly<Record<PlatformStatus, string>>;

/** URL-safe id for a category heading, e.g. "Storage & Files" → "storage-files". */
export const categorySlug = (category: string): string =>
  category.toLowerCase().replaceAll("&", " ").trim().replaceAll(/\s+/g, "-");

export interface PlatformGroup {
  category: string;
  slug: string;
  services: readonly PlatformService[];
}

/** Services grouped in category order; empty categories are dropped. */
export const groupPlatformServices = (
  services: readonly PlatformService[],
  order: readonly string[]
): PlatformGroup[] =>
  order
    .map((category) => ({
      category,
      slug: categorySlug(category),
      services: services.filter((service) => service.category === category),
    }))
    .filter((group) => group.services.length > 0);

/** The hero's proof: one stat per status that has services, plus the category count. */
export const platformStats = (
  services: readonly PlatformService[],
  groups: readonly PlatformGroup[],
  statusLabels: PlatformStatusLabels,
  categoriesLabel: string
): { value: string; label: string }[] => {
  const statuses = Object.keys(statusLabels) as PlatformStatus[];
  const byStatus = statuses
    .map((status) => ({
      value: String(services.filter((service) => service.status === status).length),
      label: statusLabels[status],
    }))
    .filter((stat) => stat.value !== "0");
  return [...byStatus, { value: String(groups.length), label: categoriesLabel }];
};
