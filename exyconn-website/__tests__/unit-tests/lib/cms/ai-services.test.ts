/** The AI service catalogue read from the /ai-services page's catalogue block. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsBlock } from "@exyconn/cms";
import {
  AI_SERVICES_PATH,
  aiServiceCategories,
  aiServiceLinks,
  aiServicePaths,
  allAiServices,
} from "../../../../src/lib/cms/ai-services";
import { getCmsPage, getCmsSite } from "../../../../src/lib/cms/client";
import type { CmsPublicPage, CmsPublicSite } from "../../../../src/lib/cms/types";
import { catalogueBlock, CATEGORIES, publicPage, publicSite } from "./fixtures";

vi.mock("../../../../src/lib/cms/client", () => ({ getCmsPage: vi.fn(), getCmsSite: vi.fn() }));

const page = vi.mocked(getCmsPage);
const site = vi.mocked(getCmsSite);

const pageWith = (blocks: CmsBlock[]): CmsPublicPage => publicPage({ blocks });

beforeEach(() => {
  page.mockReset();
  site.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("aiServiceCategories", () => {
  it("reads the categories from a catalogue nested inside other components", async () => {
    page.mockResolvedValue(
      pageWith([
        { kind: "html", html: "<main>" },
        { kind: "component", key: "layout.section", props: {}, children: [] },
        {
          kind: "component",
          key: "layout.wrap",
          props: {},
          children: [{ kind: "fragment", fragmentId: "f1" }, catalogueBlock(CATEGORIES)],
        },
      ])
    );
    await expect(aiServiceCategories("site-1")).resolves.toEqual(CATEGORIES);
    expect(page).toHaveBeenCalledWith("site-1", AI_SERVICES_PATH);
  });

  it("has no categories without the page, the block or a category list", async () => {
    page.mockResolvedValueOnce(null);
    await expect(aiServiceCategories("s")).resolves.toEqual([]);
    page.mockResolvedValueOnce(pageWith([{ kind: "html", html: "<p>" }]));
    await expect(aiServiceCategories("s")).resolves.toEqual([]);
    page.mockResolvedValueOnce(
      pageWith([{ kind: "component", key: "aiservice.catalogue", props: {}, children: [] }])
    );
    await expect(aiServiceCategories("s")).resolves.toEqual([]);
  });
});

describe("allAiServices", () => {
  it("flattens every category's services in listing order", () => {
    expect(allAiServices(CATEGORIES).map((service) => service.slug)).toEqual([
      "chatbots",
      "voice",
      "forecasting",
    ]);
    expect(allAiServices([])).toEqual([]);
  });
});

describe("aiServicePaths", () => {
  it("lists each service page's path", async () => {
    page.mockResolvedValue(pageWith([catalogueBlock(CATEGORIES)]));
    await expect(aiServicePaths("site-1")).resolves.toEqual([
      "/ai-services/chatbots",
      "/ai-services/voice",
      "/ai-services/forecasting",
    ]);
  });

  it("is empty without a site, and logs and is empty when the CMS fails", async () => {
    await expect(aiServicePaths(undefined)).resolves.toEqual([]);
    expect(page).not.toHaveBeenCalled();
    page.mockRejectedValue(new Error("down"));
    await expect(aiServicePaths("site-1")).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      "The AI service catalogue could not be read from the CMS",
      expect.any(Error)
    );
  });
});

describe("aiServiceLinks", () => {
  it("links each service of the host's site by title", async () => {
    site.mockResolvedValue(publicSite({ id: "site-9" }) satisfies CmsPublicSite);
    page.mockResolvedValue(pageWith([catalogueBlock(CATEGORIES)]));
    const links = await aiServiceLinks("exyconn.com");
    expect(site).toHaveBeenCalledWith("exyconn.com");
    expect(page).toHaveBeenCalledWith("site-9", AI_SERVICES_PATH);
    expect(links[0]).toEqual({ label: "Chatbots", href: "/ai-services/chatbots" });
    expect(links).toHaveLength(3);
  });

  it("logs and is empty when the site cannot be read", async () => {
    site.mockRejectedValue(new Error("down"));
    await expect(aiServiceLinks("exyconn.com")).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});
