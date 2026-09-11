/**
 * Unit tests for the portal-content helpers that back /blog, /case-studies and /our-tools.
 * No network: these are pure functions over the shapes the portal returns.
 */
import { describe, it, expect } from "vitest";

import { getAllTags, getToolLaunchUrl, isToolAppSlug } from "../src/lib/portal/helpers";
import { sanitizeArticleHtml, scopeArticleCss } from "../src/lib/portal/sanitize";
import type { BlogPost } from "../src/lib/portal/types";

const post = (slug: string, tags: string[]): BlogPost => ({
  id: slug,
  slug,
  title: slug,
  summary: "",
  content: "",
  contentCss: "",
  author: { name: "Exyconn", role: "", initials: "EX" },
  readTime: "5 min read",
  tags,
  coverImage: "",
  featured: false,
  publishedAt: "2026-01-02T00:00:00.000Z",
});

describe("getAllTags", () => {
  it("de-duplicates across posts and sorts alphabetically", () => {
    const posts = [post("a", ["Trends", "AI"]), post("b", ["AI", "Automation"])];
    expect(getAllTags(posts)).toEqual(["AI", "Automation", "Trends"]);
  });

  it("returns nothing when no post is tagged", () => {
    expect(getAllTags([post("a", [])])).toEqual([]);
  });
});

describe("getToolLaunchUrl", () => {
  it("resolves an app path against the tools domain, keeping the slug", () => {
    expect(getToolLaunchUrl({ url: "/tools/logo-set" })).toBe(
      "https://tools.exyconn.com/tools/logo-set"
    );
    expect(isToolAppSlug({ url: "/tools/logo-set" })).toBe(true);
  });

  it("leaves an address that is already absolute alone", () => {
    expect(getToolLaunchUrl({ url: "https://example.com/thing" })).toBe(
      "https://example.com/thing"
    );
    expect(isToolAppSlug({ url: "https://example.com/thing" })).toBe(false);
  });

  it("does not treat an unrelated site path as a tools-app slug", () => {
    expect(isToolAppSlug({ url: "/our-tools/logo-set" })).toBe(false);
  });
});

describe("sanitizeArticleHtml", () => {
  it("keeps the markup the migrated bodies use", () => {
    const html =
      '<p class="lead">Intro</p><h2>Trends</h2><ul><li><strong>Agentic AI:</strong> agents</li></ul>' +
      "<blockquote>Quote</blockquote>";
    expect(sanitizeArticleHtml(html)).toBe(html);
  });

  it("keeps images and code blocks", () => {
    const html =
      '<img src="https://img.test/a.png" alt="A" /><pre><code>npm run build</code></pre>';
    const clean = sanitizeArticleHtml(html);
    expect(clean).toContain('src="https://img.test/a.png"');
    expect(clean).toContain("<code>npm run build</code>");
  });

  it("strips scripts, event handlers and javascript: URLs", () => {
    const clean = sanitizeArticleHtml(
      '<p onclick="steal()">Hi</p><script>steal()</script><a href="javascript:steal()">x</a>'
    );
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("javascript:");
    expect(clean).toContain("Hi");
  });

  it("marks links rel=noopener so a new tab cannot reach back", () => {
    expect(sanitizeArticleHtml('<a href="https://example.com">x</a>')).toContain(
      'rel="noopener noreferrer"'
    );
  });
});

/**
 * What the portal's rich-text editor writes (@exyconn/rich-text — its extensions test holds
 * the same samples). A body the editor produced must come through untouched.
 */
describe("sanitizeArticleHtml — rich-text editor output", () => {
  it("keeps tables with header cells, spans and column widths", () => {
    // (sanitize-html writes a kept style back without spaces — the samples use that form.)
    const html =
      '<table style="min-width:75px"><colgroup><col style="width:120px" /></colgroup><tbody>' +
      '<tr><th colspan="1" rowspan="1"><p>Plan</p></th></tr>' +
      '<tr><td colspan="2" rowspan="1"><p>Custom</p></td></tr></tbody></table>';
    expect(sanitizeArticleHtml(html)).toBe(html);
  });

  it("keeps alignment, colour and highlight, in hex or rgb", () => {
    const html =
      '<p style="text-align:center"><span style="color:rgb(21, 93, 252)">blue</span> ' +
      '<mark data-color="#ffd166" style="background-color:#ffd166">marked</mark></p>';
    expect(sanitizeArticleHtml(html)).toBe(html);
  });

  it("drops any other inline style", () => {
    const clean = sanitizeArticleHtml(
      '<p style="position:fixed;inset:0;color:#111827">x</p><span style="color:expression(alert(1))">y</span>'
    );
    expect(clean).toContain('<p style="color:#111827">x</p>');
    expect(clean).not.toContain("position");
    expect(clean).not.toContain("expression");
  });

  it("keeps check lists, and the reader cannot tick them", () => {
    const clean = sanitizeArticleHtml(
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="true">' +
        '<label><input type="checkbox" checked="checked" onclick="x()" /><span></span></label>' +
        "<div><p>Ship it</p></div></li></ul>"
    );
    expect(clean).toContain('data-type="taskList"');
    expect(clean).toContain('data-checked="true"');
    expect(clean).toContain('<input type="checkbox" disabled checked />');
    expect(clean).not.toContain("onclick");
  });

  it("keeps sized images", () => {
    const html = '<img src="https://ik.imagekit.io/x/a.png" alt="Team" width="320" height="200" />';
    expect(sanitizeArticleHtml(html)).toBe(html);
  });
});

describe("sanitizeArticleHtml — live editor output", () => {
  it("keeps the ids its CSS rules are keyed by", () => {
    const html = '<div id="i3kd"><p id="ix9f">Callout</p></div>';
    expect(sanitizeArticleHtml(html)).toBe(html);
  });

  it("renames its <strike> to <s>", () => {
    expect(sanitizeArticleHtml("<p><strike>old</strike></p>")).toBe("<p><s>old</s></p>");
  });
});

describe("scopeArticleCss", () => {
  it("is empty for a rich-text body", () => {
    expect(scopeArticleCss("")).toBe("");
    expect(scopeArticleCss("   ")).toBe("");
  });

  it("nests every rule under the article", () => {
    expect(
      scopeArticleCss("#i3kd{padding:16px;}@media (max-width: 480px){#i3kd{padding:8px;}}")
    ).toBe(".article-body{#i3kd{padding:16px;}@media (max-width: 480px){#i3kd{padding:8px;}}}");
  });

  it("cannot close the style element it is printed into", () => {
    const scoped = scopeArticleCss('#a{content:"</style><script>x()</script>";}');
    expect(scoped).not.toContain("<");
    expect(scoped).toContain(String.raw`\3c /style>`);
  });

  it("drops rules whose braces would step out of the article", () => {
    expect(scopeArticleCss("#a{color:red;}} body{display:none;")).toBe("");
    expect(scopeArticleCss("#a{color:red;")).toBe("");
  });

  it("ignores braces inside comments", () => {
    expect(scopeArticleCss("/* } */#a{color:red;}")).toBe(".article-body{/* } */#a{color:red;}}");
  });
});
