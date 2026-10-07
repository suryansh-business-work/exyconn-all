import { describe, expect, it } from "vitest";
import {
  categorySlug,
  groupPlatformServices,
  platformStats,
  type PlatformService,
} from "../../../../src/lib/services/platform";

const service = (id: string, category: string, status: PlatformService["status"]) => ({
  id,
  name: id,
  description: "",
  status,
  category,
  features: [],
});

const services: PlatformService[] = [
  service("email", "Messaging", "live"),
  service("sms", "Messaging", "dev"),
  service("files", "Storage & Files", "live"),
  service("stray", "Unlisted", "soon"),
];

const labels = { live: "Live", dev: "In development", soon: "Coming soon" };

describe("platform categories", () => {
  it("slugs a category heading for its anchor", () => {
    expect(categorySlug("Storage & Files")).toBe("storage-files");
    expect(categorySlug("  AI   Tools ")).toBe("ai-tools");
  });

  it("groups services in category order and drops empty or unlisted categories", () => {
    const groups = groupPlatformServices(services, ["Storage & Files", "Payments", "Messaging"]);

    expect(groups).toEqual([
      { category: "Storage & Files", slug: "storage-files", services: [services[2]] },
      { category: "Messaging", slug: "messaging", services: [services[0], services[1]] },
    ]);
  });
});

describe("platform stats", () => {
  it("counts each status that has services, then the categories", () => {
    const groups = groupPlatformServices(services, ["Messaging", "Storage & Files"]);

    expect(platformStats(services.slice(0, 3), groups, labels, "Categories")).toEqual([
      { value: "2", label: "Live" },
      { value: "1", label: "In development" },
      { value: "2", label: "Categories" },
    ]);
  });

  it("still reports the category count when there are no services", () => {
    expect(platformStats([], [], labels, "Categories")).toEqual([
      { value: "0", label: "Categories" },
    ]);
  });
});
