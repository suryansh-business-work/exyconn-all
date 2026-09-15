/**
 * Unit tests for the output-encoding helpers: JSON-LD serialisation and link-scheme checks.
 */
import { describe, it, expect } from "vitest";

import { getToolLaunchUrl } from "../src/lib/portal/helpers";
import { safeHref, serializeJsonLd } from "../src/lib/safe-output";

describe("serializeJsonLd", () => {
  it("cannot close the script element it is printed into", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>", a: "&", b: "<!--" });
    expect(out).not.toMatch(/[<>&]/);
    expect(out).toContain(String.raw`\u003c/script\u003e`);
  });

  it("escapes the JS line separators and round-trips to the same data", () => {
    const value = { text: "a\u2028b\u2029c <b> & d", n: 1 };
    const out = serializeJsonLd(value);
    expect(out).not.toMatch(/[\u2028\u2029]/);
    expect(JSON.parse(out)).toEqual(value);
  });
});

describe("safeHref", () => {
  it.each([
    "https://exyconn.com/x",
    "http://example.com",
    "mailto:hi@exyconn.com",
    "tel:+911234567890",
    "/case-studies/a",
    "#top",
    "?q=1",
  ])("keeps %s", (url) => {
    expect(safeHref(url)).toBe(url);
  });

  it.each([
    "javascript:alert(1)",
    " JavaScript:alert(1)",
    "java\tscript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox",
    "//evil.example",
    String.raw`/\evil.example`,
    "not a url",
    "",
    undefined,
  ])("drops %s", (url) => {
    expect(safeHref(url)).toBe("");
  });

  it("drops a tool URL with an unsafe scheme", () => {
    expect(getToolLaunchUrl({ url: "javascript:alert(1)" })).toBe("");
    expect(getToolLaunchUrl({ url: "https://a.example" })).toBe("https://a.example");
  });
});
