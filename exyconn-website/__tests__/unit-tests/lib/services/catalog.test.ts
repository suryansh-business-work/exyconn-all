import { describe, expect, it } from "vitest";
import {
  catalogServices,
  countLabel,
  hubLinks,
  otherHubs,
  pillarGroups,
  serviceIndex,
  servicePillars,
  type ServicePillar,
} from "../../../../src/lib/services/catalog";

const pillars: ServicePillar[] = [
  {
    id: "build",
    label: "build",
    title: "Build",
    text: "Make things",
    services: [
      { title: "Apps", summary: "Apps that ship", href: "/apps", tags: ["iOS"] },
      { title: "SaaS", summary: "Software", href: "/saas", tags: [] },
    ],
  },
  { id: "grow", label: "Grow", title: "Grow", text: "Sell things", services: [] },
];

describe("service catalogue", () => {
  it("groups the services into build, modernise and grow, each linking under /services", () => {
    expect(servicePillars.map((pillar) => pillar.id)).toEqual(["build", "modernise", "grow"]);
    const hrefs = catalogServices().map((service) => service.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/services\/[a-z-]+$/);
    }
  });

  it("flattens the given pillars in order", () => {
    expect(catalogServices(pillars).map((service) => service.title)).toEqual(["Apps", "SaaS"]);
  });
});

describe("labels", () => {
  it("indexes a card by its pillar's initial and its two-digit place", () => {
    expect(serviceIndex({ label: "build" }, 0)).toBe("B/01");
    expect(serviceIndex({ label: "Grow" }, 9)).toBe("G/10");
  });

  it("counts in the singular for one and the plural otherwise", () => {
    expect(countLabel(1, "service", "services")).toBe("1 service");
    expect(countLabel(0, "service", "services")).toBe("0 services");
    expect(countLabel(4, "service", "services")).toBe("4 services");
  });
});

describe("hub cross-links", () => {
  it("shows every other hub from the current one", () => {
    const others = otherHubs("/services");
    expect(others).toHaveLength(hubLinks.length - 1);
    expect(others.map((link) => link.href)).not.toContain("/services");
  });

  it("shows them all from a page that is not a hub", () => {
    expect(otherHubs("/contact", hubLinks.slice(0, 2))).toEqual(hubLinks.slice(0, 2));
  });
});

describe("pillar card groups", () => {
  it("turns each pillar's services into indexed cards", () => {
    expect(pillarGroups(pillars)).toEqual([
      {
        id: "build",
        label: "build",
        title: "Build",
        text: "Make things",
        cards: [
          { href: "/apps", title: "Apps", text: "Apps that ship", tags: ["iOS"], index: "B/01" },
          { href: "/saas", title: "SaaS", text: "Software", tags: [], index: "B/02" },
        ],
      },
      { id: "grow", label: "Grow", title: "Grow", text: "Sell things", cards: [] },
    ]);
  });

  it("uses the site's own pillars by default", () => {
    expect(pillarGroups().map((group) => group.cards.length)).toEqual(
      servicePillars.map((pillar) => pillar.services.length)
    );
  });
});
