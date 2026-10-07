// @vitest-environment jsdom
/** The quote summary as text in the page's language, and saving it as a .txt file. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  downloadSummary,
  draftSummary,
} from "../../../../../src/components/company/quote/download";
import type { QuoteDraft } from "../../../../../src/components/company/quote/quote-store";
import { DEFAULT_QUOTE_INPUT } from "../../../../../src/lib/company/quote";
import { spyOnDownloads } from "../../download-spy";

const EMAIL = "services@exyconn.com";
const DRAFT: QuoteDraft = { input: DEFAULT_QUOTE_INPUT, description: "  A booking app  " };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-07T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.documentElement.lang = "";
});

describe("draftSummary", () => {
  it("dates the summary in the page's language and names where to write", () => {
    document.documentElement.lang = "en-GB";
    const text = draftSummary(DRAFT, EMAIL);
    expect(text).toContain("Generated: 7 October 2026");
    expect(text).toContain("Description: A booking app");
    expect(text).toContain("ESTIMATED TOTAL: $24,480");
    expect(text).toContain(`Contact us: ${EMAIL}`);
    expect(text).toContain(`Website: ${globalThis.location.origin}`);
  });

  it("uses the browser's own language when the page names none", () => {
    const expected = new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date());
    expect(draftSummary(DRAFT, EMAIL)).toContain(`Generated: ${expected}`);
  });
});

describe("downloadSummary", () => {
  it("saves the summary as a dated .txt file and frees the URL", () => {
    const downloads = spyOnDownloads();
    downloadSummary(DRAFT, EMAIL);

    expect(downloads.saved).toEqual([
      {
        href: "blob:http://localhost/1",
        download: "exyconn-budget-estimate-2026-10-07.txt",
        attached: true,
      },
    ]);
    expect(downloads.blobs[0].type).toBe("text/plain;charset=utf-8");
    expect(downloads.blobs[0].size).toBe(
      new TextEncoder().encode(draftSummary(DRAFT, EMAIL)).length
    );
    expect(downloads.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/1");
    expect(document.querySelector("a[download]")).toBeNull();
  });
});
