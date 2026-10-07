import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const portalRequest = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/portal/client", () => ({ portalRequest }));

import {
  BRANDING_FALLBACK,
  getBranding,
  getBrandingSafe,
  getJobsWithCompanies,
  getOpenGigs,
} from "../../../../src/lib/portal/queries";
import { brandFallback } from "../../../../src/styles/tokens/brand.tokens";
import { company, gig, job } from "../career/fixtures";

/** Answers each read by the field its query asks for. */
const answerByField = (answers: Record<string, unknown>) => {
  portalRequest.mockImplementation(async (query: string) => {
    const field = Object.keys(answers).find((key) => query.includes(`${key}(`));
    if (!field) {
      throw new Error(`Unexpected query: ${query}`);
    }
    return { [field]: answers[field] };
  });
};

beforeEach(() => {
  portalRequest.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("jobs with their companies", () => {
  it("pairs each job with its company, drops orphans and sorts newest first", async () => {
    const acme = company({ slug: "acme" });
    const beta = company({ slug: "beta", companyCode: "BETA" });
    const older = job({ jobCode: "OLD", companySlug: "acme", jobPostDate: "2026-08-01" });
    const newer = job({ jobCode: "NEW", companySlug: "beta", jobPostDate: "2026-09-15" });
    const orphan = job({ jobCode: "ORPHAN", companySlug: "gone", jobPostDate: "2026-10-01" });
    answerByField({ publicJobs: [older, orphan, newer], publicJobCompanies: [acme, beta] });

    await expect(getJobsWithCompanies("exyconn")).resolves.toEqual([
      { job: newer, company: beta },
      { job: older, company: acme },
    ]);
    for (const [, variables] of portalRequest.mock.calls) {
      expect(variables).toMatchObject({ site: "exyconn" });
    }
  });

  it("is empty when either list could not be read", async () => {
    portalRequest.mockRejectedValue(new Error("down"));
    await expect(getJobsWithCompanies()).resolves.toEqual([]);
  });
});

describe("open gigs", () => {
  it("keeps only gigs still open for applications", async () => {
    const open = gig({ gigCode: "OPEN" });
    answerByField({ publicGigs: [open, gig({ gigCode: "SHUT", status: "closed" })] });

    await expect(getOpenGigs("s")).resolves.toEqual([open]);
  });
});

describe("branding", () => {
  it("reads the portal's branding", async () => {
    const branding = { ...BRANDING_FALLBACK, businessName: "Acme" };
    portalRequest.mockResolvedValue({ publicBranding: branding });

    await expect(getBranding()).resolves.toBe(branding);
    await expect(getBrandingSafe()).resolves.toBe(branding);
    expect(portalRequest.mock.calls[0][0]).toContain("publicBranding");
  });

  it("lets getBranding throw, while getBrandingSafe falls back to the bundled branding", async () => {
    const failure = new Error("portal down");
    portalRequest.mockRejectedValue(failure);

    await expect(getBranding()).rejects.toBe(failure);
    await expect(getBrandingSafe()).resolves.toBe(BRANDING_FALLBACK);
    expect(console.error).toHaveBeenCalledWith(
      "Portal branding fetch failed — using bundled fallback branding.",
      failure
    );
  });

  it("ships fallback colours from the brand tokens and leaves unrendered fields empty", () => {
    expect(BRANDING_FALLBACK).toMatchObject({
      businessName: "Exyconn",
      primaryColor: brandFallback.primary,
      secondaryColor: brandFallback.secondary,
      accentColor: brandFallback.accent,
      backgroundColor: brandFallback.background,
      textColor: brandFallback.text,
      copyrightText: "",
      facebookUrl: "",
    });
  });
});
