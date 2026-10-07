/** The policy list and policy detail loaders, including Legal's library being unreachable. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { policyListLoader, policyLoader } from "../../../../../src/lib/cms/loaders/policies";
import { loadPolicies, loadPolicy } from "../../../../../src/lib/legal";
import { policy } from "../fixtures";
import { CRUMBS, loaderInput } from "./input";

vi.mock("../../../../../src/lib/legal", () => ({ loadPolicies: vi.fn(), loadPolicy: vi.fn() }));

const list = vi.mocked(loadPolicies);
const one = vi.mocked(loadPolicy);

beforeEach(() => {
  list.mockReset();
  one.mockReset();
});

describe("policyListLoader", () => {
  it("passes the policies on with the list's breadcrumbs", async () => {
    const result = { status: "ok" as const, policies: [policy()] };
    list.mockResolvedValue(result);
    const load = await policyListLoader(loaderInput({}));
    expect(load?.item).toBe(result);
    expect(load?.status).toBeUndefined();
    expect(load?.jsonLd?.[0]).toMatchObject({ "@type": "BreadcrumbList" });
    expect(load?.jsonLd?.[0].itemListElement).toHaveLength(CRUMBS.length);
  });

  it("still renders, as a 503, when the library fails", async () => {
    list.mockResolvedValue({ status: "error" });
    const load = await policyListLoader(loaderInput({}));
    expect(load?.item).toEqual({ status: "error" });
    expect(load?.status).toBe(503);
  });
});

describe("policyLoader", () => {
  it("is a 404 for an unknown slug", async () => {
    one.mockResolvedValue({ status: "missing" });
    await expect(policyLoader(loaderInput({ slug: "nope" }))).resolves.toBeNull();
    expect(one).toHaveBeenCalledWith("nope");
  });

  it("reads a found policy, indexed, with its SEO values", async () => {
    const found = policy();
    one.mockResolvedValue({ status: "found", policy: found });
    const load = await policyLoader(loaderInput({ slug: "privacy" }));
    expect(load?.item).toEqual({ policy: found, title: "Privacy Policy" });
    expect(load?.status).toBeUndefined();
    expect(load?.noindex).toBe(false);
    expect(load?.vars).toEqual({
      title: "Privacy Policy",
      titleLower: "privacy policy",
      summary: "How we handle data",
    });
    expect(load?.jsonLd?.[0].itemListElement).toHaveLength(CRUMBS.length + 1);
  });

  it("renders the component's fallback copy as an unindexed 503 when the read fails", async () => {
    one.mockResolvedValue({ status: "error" });
    const load = await policyLoader(
      loaderInput(
        { slug: "privacy" },
        { crumbs: CRUMBS, fallbackTitle: "Our Policy", fallbackSummary: "Back soon" }
      )
    );
    expect(load?.item).toEqual({ policy: null, title: "Our Policy" });
    expect(load?.status).toBe(503);
    expect(load?.noindex).toBe(true);
    expect(load?.vars).toEqual({
      title: "Our Policy",
      titleLower: "our policy",
      summary: "Back soon",
    });
  });

  it("uses empty copy when the fallbacks are not text", async () => {
    one.mockResolvedValue({ status: "error" });
    const load = await policyLoader(
      loaderInput({ slug: "privacy" }, { fallbackTitle: 7, fallbackSummary: null })
    );
    expect(load?.vars).toEqual({ title: "", titleLower: "", summary: "" });
  });
});
