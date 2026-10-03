/**
 * The services hubs' data modules: the catalogue's grouping and cross-links, the
 * infrastructure platform's grouping and stats, and the AI catalogue's scenes.
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
import { hubStats } from "../../src/lib/services/hub";
import {
  categorySlug,
  groupPlatformServices,
  platformCategories,
  platformServices,
  platformStats,
  type PlatformService,
} from "../../src/lib/services/platform";
import {
  catalogueScene,
  catalogueStats,
  categoryHref,
  categoryTag,
  detailCopy,
  sceneForCategory,
} from "../../src/lib/services/aiCatalogue";
import {
  lifecycleSteps,
  outsourcingFaqs,
  outsourcingServices,
} from "../../src/lib/services/outsourcing";
import { aiServiceCategories, aiServices } from "../../src/lib/services/aiServices";
import { capabilityGroups, governance } from "../../src/lib/services/aiHub";
import { marketingServices, marketingStats } from "../../src/lib/services/digitalMarketing";
import { portfolioGroups } from "../../src/lib/services/ourServices";
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

  it("derives the hub's service count from the catalogue", () => {
    expect(hubStats[0].value).toBe(String(catalogServices().length));
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
    expect(platformStats(services, groups)).toEqual([
      { value: "2", label: "Live" },
      { value: "1", label: "Coming soon" },
      { value: "1", label: "Categories" },
    ]);
  });
});

describe("AI catalogue", () => {
  it("counts services and categories from the data", () => {
    expect(catalogueStats().map((stat) => stat.value)).toEqual([
      String(aiServices.length),
      String(aiServiceCategories.length),
    ]);
  });

  it("links a category to the filtered listing", () => {
    expect(categoryHref("trust-security")).toBe("/ai-services?cat=trust-security");
  });

  it("tags categories from 1 in listing order", () => {
    expect(categoryTag(aiServiceCategories[0].slug)).toBe(1);
    expect(categoryTag("unknown")).toBe(0);
  });

  it("orbits one agent module per category round the listing's neural core", () => {
    expect(catalogueScene()).toEqual({
      shapes: ["neuralCore"],
      data: { neuralCore: { modules: aiServiceCategories.length } },
    });
  });

  it("gives every category a known shape sized by its services", () => {
    aiServiceCategories.forEach((category) => {
      const scene = sceneForCategory(category.slug);
      scene.shapes.forEach((shape) => expect(isShapeId(shape)).toBe(true));
    });
    expect(sceneForCategory("agents-automation").data?.neuralCore?.modules).toBeGreaterThan(0);
    expect(sceneForCategory("revenue-growth").shapes).toEqual(["dataflow"]);
    expect(sceneForCategory("business-operations").shapes).toEqual(["dataflow"]);
    expect(sceneForCategory("vertical-platforms").shapes).toEqual(["cloudStack"]);
    expect(sceneForCategory("platform-infrastructure").data?.aiChip?.pads).toBeGreaterThan(0);
    expect(sceneForCategory("trust-security")).toEqual({ shapes: ["shield"] });
    expect(sceneForCategory("unknown")).toEqual({ shapes: ["core"] });
  });
});

describe("hub content", () => {
  it("maps the AI capabilities to Build / Models / Connect, linking /ai pages", () => {
    expect(capabilityGroups.map((group) => group.label)).toEqual(["Build", "Models", "Connect"]);
    capabilityGroups
      .flatMap((group) => group.cards)
      .forEach((card) => expect(card.href.startsWith("/ai/")).toBe(true));
  });

  it("reads the governance band from the catalogue's trust & security category", () => {
    expect(governance.category?.slug).toBe("trust-security");
    expect(governance.services.length).toBeGreaterThan(0);
  });

  it("keeps the marketing anchors the hub used to deep-link", () => {
    expect(marketingServices.map((s) => s.id)).toEqual([
      "seo",
      "ppc",
      "social",
      "content",
      "email",
      "branding",
      "influencer",
      "cro",
      "analytics",
    ]);
    expect(marketingStats[0].value).toBe(String(marketingServices.length));
  });

  it("names the related chapter after the category", () => {
    expect(detailCopy.relatedTitle("Trust & Security")).toBe("More in Trust & Security");
  });

  it("carries the outsourcing page's FAQ, offer and the shared lifecycle", () => {
    expect(outsourcingFaqs.length).toBeGreaterThan(0);
    outsourcingFaqs.forEach((faq) => expect(faq.answer.length).toBeGreaterThan(20));
    expect(outsourcingServices).toHaveLength(6);
    expect(lifecycleSteps.map((step) => step.title)).toEqual([
      "Ideation",
      "Development & launch",
      "Growth & maturity",
      "End of life",
    ]);
  });

  it("gives every portfolio row a link", () => {
    portfolioGroups
      .flatMap((group) => group.services)
      .forEach((row) => expect(row.href.startsWith("/")).toBe(true));
  });
});
