/**
 * The services hubs' data modules: the catalogue's grouping and cross-links, the
 * infrastructure platform's grouping and stats, and the AI capability map.
 */
import { describe, expect, it } from "vitest";
import {
  catalogServices,
  countLabel,
  hubLinks,
  otherHubs,
  pillarGroups,
  serviceIndex,
  servicePillars,
} from "../../src/lib/services/catalog";
import {
  categorySlug,
  groupPlatformServices,
  platformStats,
  type PlatformService,
  type PlatformStatusLabels,
} from "../../src/lib/services/platform";
import { cmsDefaults } from "../cms-defaults";
import { capabilityGroups } from "../../src/lib/services/aiHub";

const platform = cmsDefaults<{
  categories: string[];
  services: PlatformService[];
  statusLabels: PlatformStatusLabels;
}>("company.platform-hub");
const platformCategories = platform.categories;
const platformServices = platform.services;
const portfolioGroups = cmsDefaults<{ groups: { services: { href: string }[] }[] }>(
  "company.link-rows"
).groups;
import { isShapeId } from "../../src/scripts/stage3d/shapes/registry";

const service = (overrides: Partial<PlatformService>): PlatformService => ({
  id: "x",
  name: "X",
  description: "d",
  status: "live",
  category: "A",
  features: [],
  ...overrides,
});

describe("services catalogue", () => {
  it("has the three blueprint pillars, each with services", () => {
    expect(servicePillars.map((pillar) => pillar.label)).toEqual(["Build", "Modernise", "Grow"]);
    servicePillars.forEach((pillar) => expect(pillar.services.length).toBeGreaterThan(0));
  });

  it("lists every service once, with a root-relative link and three tags", () => {
    const services = catalogServices();
    expect(new Set(services.map((s) => s.href)).size).toBe(services.length);
    services.forEach((s) => {
      expect(s.href.startsWith("/services/")).toBe(true);
      expect(s.tags).toHaveLength(3);
    });
  });

  it("links the outsourcing page from the hub (audit: it was unlinked)", () => {
    expect(catalogServices().map((s) => s.href)).toContain(
      "/services/software-development-outsourcing"
    );
  });

  it("indexes a card by pillar initial and position", () => {
    expect(serviceIndex({ label: "grow" }, 2)).toBe("G/03");
  });

  it("shapes the pillars as card groups", () => {
    const [build] = pillarGroups();
    expect(build.id).toBe("build");
    expect(build.cards[0]).toMatchObject({
      index: "B/01",
      href: servicePillars[0].services[0].href,
    });
    expect(pillarGroups([])).toEqual([]);
  });

  it("counts with the right grammar", () => {
    expect(countLabel(1, "service", "services")).toBe("1 service");
    expect(countLabel(0, "service", "services")).toBe("0 services");
    expect(countLabel(4, "service", "services")).toBe("4 services");
  });

  it("cross-links every overlapping hub except the current one", () => {
    const others = otherHubs("/services");
    expect(others).toHaveLength(hubLinks.length - 1);
    expect(others.map((link) => link.href)).not.toContain("/services");
    ["/our-services", "/exyconn-services", "/ai", "/ai-services"].forEach((href) =>
      expect(others.map((link) => link.href)).toContain(href)
    );
    expect(otherHubs("/elsewhere", hubLinks.slice(0, 1))).toHaveLength(1);
  });
});

describe("infrastructure platform", () => {
  it("slugs category names for anchors", () => {
    expect(categorySlug("Storage & Files")).toBe("storage-files");
    expect(categorySlug("Developer Tools")).toBe("developer-tools");
    expect(categorySlug("Global")).toBe("global");
  });

  it("groups in category order and drops empty categories", () => {
    const groups = groupPlatformServices(
      [service({ id: "b", category: "B" }), service({ id: "a", category: "A" })],
      ["A", "Empty", "B"]
    );
    expect(groups.map((g) => g.category)).toEqual(["A", "B"]);
    expect(groups[0].slug).toBe("a");
  });

  it("puts every real service in a known category", () => {
    const groups = groupPlatformServices(platformServices, platformCategories);
    const grouped = groups.reduce((total, group) => total + group.services.length, 0);
    expect(grouped).toBe(platformServices.length);
    expect(new Set(platformServices.map((s) => s.id)).size).toBe(platformServices.length);
  });

  it("shows only the statuses that have services, then the category count", () => {
    const services = [service({}), service({ status: "soon" }), service({ status: "live" })];
    const groups = groupPlatformServices(services, ["A"]);
    expect(platformStats(services, groups, platform.statusLabels, "Categories")).toEqual([
      { value: "2", label: "Live" },
      { value: "1", label: "Coming soon" },
      { value: "1", label: "Categories" },
    ]);
  });
});

describe("hub content", () => {
  it("maps the AI capabilities to Build / Models / Connect, linking /ai pages", () => {
    expect(capabilityGroups.map((group) => group.label)).toEqual(["Build", "Models", "Connect"]);
    capabilityGroups
      .flatMap((group) => group.cards)
      .forEach((card) => expect(card.href.startsWith("/ai/")).toBe(true));
  });

  it("gives every portfolio row a link", () => {
    portfolioGroups
      .flatMap((group) => group.services)
      .forEach((row) => expect(row.href.startsWith("/")).toBe(true));
  });
});
