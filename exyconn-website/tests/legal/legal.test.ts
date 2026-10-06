import { afterEach, describe, expect, it, vi } from "vitest";
import { readerDate } from "../../src/lib/legal/dates";
import {
  loadPolicies,
  loadPolicy,
  policyRow,
  policySheets,
  policySummary,
} from "../../src/lib/legal/policies";
import { LEGAL_LINKS, relatedLegalLinks } from "../../src/lib/legal/related";
import * as legal from "../../src/lib/legal";
import type { PublicPolicy } from "../../src/lib/portal/types";
import { cmsDefaults } from "../cms-defaults";

const policy: PublicPolicy = {
  title: "Acceptable use",
  slug: "acceptable-use",
  summary: "What you may do with our services.",
  body: "<h2>Scope</h2><p>All services.</p>",
  version: 3,
  effectiveDate: "2026-01-05T00:00:00.000Z",
  updatedAt: "2026-02-10T18:30:00.000Z",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("barrel", () => {
  it("exposes the page API from one entry point", () => {
    expect(legal.readerDate).toBe(readerDate);
    expect(legal.relatedLegalLinks).toBe(relatedLegalLinks);
  });
});

describe("readerDate", () => {
  it("writes the date the reader's way and keeps the calendar day", () => {
    expect(readerDate("2025-06-27", "en-US")).toEqual({ iso: "2025-06-27", text: "June 27, 2025" });
    expect(readerDate("2025-06-27", "en-GB").text).toBe("27 June 2025");
    expect(readerDate("2026-02-10T23:30:00.000Z", "de-DE")).toEqual({
      iso: "2026-02-10",
      text: "10. Februar 2026",
    });
  });
});

describe("related legal links", () => {
  it("lists every legal page but the current one", () => {
    const related = relatedLegalLinks("cookies");
    expect(related).toHaveLength(LEGAL_LINKS.length - 1);
    expect(related.some((link) => link.key === "cookies")).toBe(false);
  });
});

describe("policies", () => {
  it("returns the published list", async () => {
    await expect(loadPolicies(async () => [policy])).resolves.toEqual({
      status: "ok",
      policies: [policy],
    });
  });

  it("reports a portal failure instead of throwing", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      loadPolicies(async () => {
        throw new Error("down");
      })
    ).resolves.toEqual({ status: "error" });
    expect(log).toHaveBeenCalledOnce();
  });

  it("finds, misses or fails one policy", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(loadPolicy(undefined, async () => policy)).resolves.toEqual({ status: "missing" });
    await expect(loadPolicy("x", async () => null)).resolves.toEqual({ status: "missing" });
    await expect(loadPolicy("acceptable-use", async () => policy)).resolves.toEqual({
      status: "found",
      policy,
    });
    await expect(
      loadPolicy("acceptable-use", async () => {
        throw new Error("down");
      })
    ).resolves.toEqual({ status: "error" });
    expect(log).toHaveBeenCalledOnce();
  });

  it("formats a row and the plain summary in the reader's locale", () => {
    expect(policyRow(policy, "en-GB")).toEqual({
      href: "/policies/acceptable-use",
      title: "Acceptable use",
      summary: "What you may do with our services.",
      meta: "Version 3 · Effective 5 January 2026 · Updated 10 February 2026",
      updatedIso: "2026-02-10",
    });
    expect(policySummary(policy, "en-US")).toEqual([
      "What you may do with our services.",
      "Version 3, in effect from January 5, 2026.",
    ]);
    expect(policySummary({ ...policy, summary: "" }, "en-US")).toHaveLength(1);
  });

  it("stacks one sheet per policy, up to eight", () => {
    expect(policySheets(0)).toBeUndefined();
    expect(policySheets(3)).toBe(3);
    expect(policySheets(20)).toBe(8);
  });
});

describe("last-updated dates", () => {
  it("shows only the dates the pages actually recorded", () => {
    expect(cmsDefaults<{ updated: string }>("legal.document").updated).toBe("2025-06-27");
  });
});
