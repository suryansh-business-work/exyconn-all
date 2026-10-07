/** Output encoding for portal-authored values: JSON-LD bodies and links. */
import { describe, expect, it } from "vitest";
import { safeHref, serializeJsonLd } from "../../../src/lib/safe-output";

describe("serializeJsonLd", () => {
  it("escapes everything that could close the script element, and nothing else", () => {
    const value = { name: "</script><!-- a & b >", plain: "Exyconn" };
    const out = serializeJsonLd(value);
    expect(out).not.toMatch(/[<>&]/);
    expect(out).toContain(String.raw`\u003c/script\u003e\u003c!-- a \u0026 b \u003e`);
    expect(out).toContain('"plain":"Exyconn"');
  });

  it("escapes the line and paragraph separators", () => {
    const out = serializeJsonLd({ text: "a\u2028b\u2029c" });
    expect(out).toBe(String.raw`{"text":"a\u2028b\u2029c"}`);
  });

  it("round-trips to the same data", () => {
    const value = { a: "<b>&</b>", list: [1, "x\u2028y"], nested: { ok: true } };
    expect(JSON.parse(serializeJsonLd(value))).toEqual(value);
  });
});

describe("safeHref", () => {
  it("treats a missing or blank link as no link", () => {
    expect(safeHref(undefined)).toBe("");
    expect(safeHref(null)).toBe("");
    expect(safeHref("   ")).toBe("");
  });

  it("keeps same-site paths, fragments and queries", () => {
    expect(safeHref("/about-us")).toBe("/about-us");
    expect(safeHref("/")).toBe("/");
    expect(safeHref("#contact")).toBe("#contact");
    expect(safeHref("?page=2")).toBe("?page=2");
  });

  it("trims what it keeps", () => {
    expect(safeHref("  https://exyconn.com/x  ")).toBe("https://exyconn.com/x");
  });

  it("keeps http, https, mailto and tel links", () => {
    expect(safeHref("http://example.com")).toBe("http://example.com");
    expect(safeHref("https://example.com/a?b=1")).toBe("https://example.com/a?b=1");
    expect(safeHref("mailto:hello@example.com")).toBe("mailto:hello@example.com");
    expect(safeHref("tel:+919876543210")).toBe("tel:+919876543210");
  });

  it("refuses scripting and other schemes", () => {
    expect(safeHref("javascript:alert(1)")).toBe("");
    expect(safeHref("JavaScript:alert(1)")).toBe("");
    expect(safeHref("data:text/html,<b>x</b>")).toBe("");
    expect(safeHref("ftp://example.com/file")).toBe("");
  });

  it("refuses protocol-relative links that leave the site", () => {
    expect(safeHref("//evil.example")).toBe("");
    expect(safeHref(String.raw`/\evil.example`)).toBe("");
  });

  it("refuses text that is not a URL at all", () => {
    expect(safeHref("not a link")).toBe("");
  });
});
