import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicPolicy } from "../../../../src/lib/portal/types";

const queries = vi.hoisted(() => ({
  getPublicPolicies: vi.fn(),
  getPublicPolicy: vi.fn(),
}));
vi.mock("../../../../src/lib/portal/queries", () => queries);

import {
  LEGAL_LINKS,
  loadPolicies,
  loadPolicy,
  policyRow,
  policySheets,
  policySummary,
  readerDate,
} from "../../../../src/lib/legal";

const policy = (overrides: Partial<PublicPolicy> = {}): PublicPolicy => ({
  title: "Code of conduct",
  slug: "code-of-conduct",
  summary: "How we treat each other.",
  body: "<p>Body</p>",
  version: 3,
  effectiveDate: "2025-06-27T00:00:00.000Z",
  updatedAt: "2025-09-01T08:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  queries.getPublicPolicies.mockReset();
  queries.getPublicPolicy.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("legal entry point", () => {
  it("exposes the dates and links beside the policy loaders", () => {
    expect(readerDate("2025-01-02", "en-GB").text).toBe("2 January 2025");
    expect(LEGAL_LINKS.length).toBeGreaterThan(0);
  });
});

describe("loading the policies index", () => {
  it("reads the portal's public policies by default", async () => {
    queries.getPublicPolicies.mockResolvedValue([policy()]);
    await expect(loadPolicies()).resolves.toEqual({ status: "ok", policies: [policy()] });
  });

  it("reports an error, logged, when the portal fails", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("down"));
    await expect(loadPolicies(fetch)).resolves.toEqual({ status: "error" });
    expect(console.error).toHaveBeenCalledWith(
      "Public policies could not be loaded from the portal.",
      expect.any(Error)
    );
  });
});

describe("loading one policy", () => {
  it("finds a published policy by slug through the portal by default", async () => {
    queries.getPublicPolicy.mockResolvedValue(policy());
    await expect(loadPolicy("code-of-conduct")).resolves.toEqual({
      status: "found",
      policy: policy(),
    });
    expect(queries.getPublicPolicy).toHaveBeenCalledWith("code-of-conduct");
  });

  it("is missing without a slug, without asking the portal", async () => {
    const fetch = vi.fn();
    await expect(loadPolicy(undefined, fetch)).resolves.toEqual({ status: "missing" });
    await expect(loadPolicy("", fetch)).resolves.toEqual({ status: "missing" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("is missing when the portal has no policy there", async () => {
    await expect(loadPolicy("nope", vi.fn().mockResolvedValue(null))).resolves.toEqual({
      status: "missing",
    });
  });

  it("reports an error, logged with the slug, when the portal fails", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("down"));
    await expect(loadPolicy("privacy", fetch)).resolves.toEqual({ status: "error" });
    expect(console.error).toHaveBeenCalledWith(
      'Public policy "privacy" could not be loaded from the portal.',
      expect.any(Error)
    );
  });
});

describe("policy presentation", () => {
  it("builds an index row with its dates in the reader's locale", () => {
    expect(
      policyRow(policy(), "en-GB", "Version {version} · Effective {effective} · Updated {updated}")
    ).toEqual({
      href: "/policies/code-of-conduct",
      title: "Code of conduct",
      summary: "How we treat each other.",
      meta: "Version 3 · Effective 27 June 2025 · Updated 1 September 2025",
      updatedIso: "2025-09-01",
    });
  });

  it("leads the summary points with the policy's own summary, then its version", () => {
    const template = "Version {version}, in effect from {effective}.";
    expect(policySummary(policy(), "en-US", template)).toEqual([
      "How we treat each other.",
      "Version 3, in effect from June 27, 2025.",
    ]);
    expect(policySummary(policy({ summary: "" }), "en-US", template)).toEqual([
      "Version 3, in effect from June 27, 2025.",
    ]);
  });

  it("stacks one sheet per policy within one to eight", () => {
    expect(policySheets(0)).toBeUndefined();
    expect(policySheets(3)).toBe(3);
    expect(policySheets(12)).toBe(8);
  });
});
