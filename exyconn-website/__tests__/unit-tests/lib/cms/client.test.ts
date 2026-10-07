/** The website's CMS reads: what each asks the portal, and how long the answers are cached. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCmsPage, getCmsPaths, getCmsPreview, getCmsSite } from "../../../../src/lib/cms/client";
import { portalRequest } from "../../../../src/lib/portal/client";

vi.mock("../../../../src/lib/portal/client", () => ({ portalRequest: vi.fn() }));

const request = vi.mocked(portalRequest);

beforeEach(() => {
  request.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getCmsSite", () => {
  it("asks for the host lower-cased without its port and caches per host", async () => {
    const site = { site: { id: "s1" }, designSystem: null, fragments: [] };
    request.mockResolvedValue({ publicCmsSite: site });
    await expect(getCmsSite("Site-One.TEST:4321")).resolves.toBe(site);
    await expect(getCmsSite("site-one.test")).resolves.toBe(site);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toContain("publicCmsSite(host: $host)");
    expect(request.mock.calls[0][1]).toEqual({ host: "site-one.test" });
  });

  it("asks again once the 30 second cache has expired", async () => {
    request.mockResolvedValue({ publicCmsSite: { site: { id: "s2" } } });
    await getCmsSite("site-two.test");
    vi.advanceTimersByTime(30_000);
    await getCmsSite("site-two.test");
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("passes a portal failure on without caching it", async () => {
    request.mockRejectedValueOnce(new Error("portal down"));
    await expect(getCmsSite("site-three.test")).rejects.toThrow("portal down");
    request.mockResolvedValueOnce({ publicCmsSite: { site: { id: "s3" } } });
    await expect(getCmsSite("site-three.test")).resolves.toEqual({ site: { id: "s3" } });
  });
});

describe("getCmsPage", () => {
  it("reads a published page without a preview token and caches it per site and path", async () => {
    const page = { page: { id: "p1" }, fragments: [] };
    request.mockResolvedValue({ publicCmsPage: page });
    await expect(getCmsPage("site-a", "/about")).resolves.toBe(page);
    await getCmsPage("site-a", "/about");
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toContain("publicCmsPage(");
    expect(request.mock.calls[0][1]).toEqual({
      siteId: "site-a",
      path: "/about",
      previewToken: null,
    });
  });

  it("remembers that nothing lives at a path", async () => {
    request.mockResolvedValue({ publicCmsPage: null });
    await expect(getCmsPage("site-a", "/missing")).resolves.toBeNull();
    await expect(getCmsPage("site-a", "/missing")).resolves.toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("keeps another site's page at the same path apart", async () => {
    request.mockResolvedValueOnce({ publicCmsPage: { page: { id: "a" } } });
    request.mockResolvedValueOnce({ publicCmsPage: { page: { id: "b" } } });
    await getCmsPage("site-b", "/x");
    await expect(getCmsPage("site-c", "/x")).resolves.toEqual({ page: { id: "b" } });
  });
});

describe("getCmsPreview", () => {
  it("reads the draft through its token every time", async () => {
    request.mockResolvedValue({ publicCmsPage: { page: { id: "draft" } } });
    await getCmsPreview("site-a", "tok-1");
    await getCmsPreview("site-a", "tok-1");
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0][1]).toEqual({
      siteId: "site-a",
      path: "/",
      previewToken: "tok-1",
    });
  });
});

describe("getCmsPaths", () => {
  it("lists a site's published paths, cached per site", async () => {
    const rows = [{ path: "/", updatedAt: "2026-09-01" }];
    request.mockResolvedValue({ publicCmsPaths: rows });
    await expect(getCmsPaths("site-p")).resolves.toBe(rows);
    await getCmsPaths("site-p");
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toContain("publicCmsPaths(siteId: $siteId)");
    expect(request.mock.calls[0][1]).toEqual({ siteId: "site-p" });
  });
});
