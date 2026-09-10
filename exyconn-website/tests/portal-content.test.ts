/**
 * Unit tests for the portal-content helpers that back /blog, /case-studies and /our-tools.
 * No network: these are pure functions over the shapes the portal returns.
 */
import { describe, it, expect } from "vitest";

import { getAllTags, getToolLaunchUrl, isToolAppSlug } from "../src/lib/portal/helpers";
import { sanitizeArticleHtml } from "../src/lib/portal/sanitize";
import type { BlogPost } from "../src/lib/portal/types";

const post = (slug: string, tags: string[]): BlogPost => ({
  id: slug,
  slug,
  title: slug,
  summary: "",
  content: "",
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
