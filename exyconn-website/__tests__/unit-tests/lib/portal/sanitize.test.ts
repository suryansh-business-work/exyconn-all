import { describe, expect, it } from "vitest";
import {
  ARTICLE_CLASS,
  sanitizeArticleHtml,
  scopeArticleCss,
} from "../../../../src/lib/portal/sanitize";

describe("sanitising an article body", () => {
  it("removes scripts and event handlers", () => {
    expect(sanitizeArticleHtml("<p>Hi<script>alert(1)</script></p>")).toBe("<p>Hi</p>");
    expect(
      sanitizeArticleHtml('<img src="https://cdn.test/a.png" alt="A" onerror="alert(1)">')
    ).toBe('<img src="https://cdn.test/a.png" alt="A" />');
  });

  it("drops elements the editors never produce", () => {
    expect(sanitizeArticleHtml('<iframe src="https://x.test"></iframe><p>Kept</p>')).toBe(
      "<p>Kept</p>"
    );
  });

  it("keeps the blocks the editors produce, with their ids and classes", () => {
    const html =
      '<h1 id="top" class="t">T</h1><figure><figcaption>c</figcaption></figure>' +
      '<mark data-color="#ff0">m</mark>';
    expect(sanitizeArticleHtml(html)).toBe(html);
  });

  it("stops every link reaching back at the page, and drops unsafe schemes", () => {
    expect(sanitizeArticleHtml('<a href="https://x.test" target="_blank">x</a>')).toBe(
      '<a href="https://x.test" target="_blank" rel="noopener noreferrer">x</a>'
    );
    expect(sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>')).toBe(
      '<a rel="noopener noreferrer">x</a>'
    );
    expect(sanitizeArticleHtml('<a href="mailto:a@b.co">m</a>')).toBe(
      '<a href="mailto:a@b.co" rel="noopener noreferrer">m</a>'
    );
  });

  it("renames the live editor's strike to s", () => {
    expect(sanitizeArticleHtml("<strike>old</strike>")).toBe("<s>old</s>");
  });

  it("turns every input into a disabled check-list tick, keeping whether it is ticked", () => {
    expect(
      sanitizeArticleHtml(
        '<ul data-type="taskList"><li data-type="taskItem" data-checked="true">' +
          '<label><input type="checkbox" checked></label></li></ul>'
      )
    ).toBe(
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="true">' +
        '<label><input type="checkbox" disabled checked /></label></li></ul>'
    );
    expect(sanitizeArticleHtml('<input type="text" value="x">')).toBe(
      '<input type="checkbox" disabled />'
    );
  });

  it("keeps only alignment and colour styles, in the forms the editors write", () => {
    expect(
      sanitizeArticleHtml(
        '<p style="position:fixed;color:#fff;text-align:center;background-color:rgba(0, 0, 0, 0.5)">x</p>'
      )
    ).toBe('<p style="color:#fff;text-align:center;background-color:rgba(0, 0, 0, 0.5)">x</p>');
  });

  it("keeps table widths but no other table styles or colour names", () => {
    expect(
      sanitizeArticleHtml(
        '<table style="width:100%;height:50px"><tr><td colspan="2" style="color:red">x</td></tr></table>'
      )
    ).toBe('<table style="width:100%"><tr><td colspan="2">x</td></tr></table>');
  });
});

describe("scoping a live-editor design's CSS", () => {
  it("nests the rules under the article class", () => {
    expect(ARTICLE_CLASS).toBe("article-body");
    expect(scopeArticleCss("  h2{color:#123}  ")).toBe(".article-body{h2{color:#123}}");
  });

  it("escapes '<' so the rules cannot close their style element", () => {
    expect(scopeArticleCss("a::after{content:'</style>'}")).toBe(
      String.raw`.article-body{a::after{content:'\3c /style>'}}`
    );
  });

  it("ignores braces inside comments when checking balance", () => {
    expect(scopeArticleCss("/* { */ a{color:red}")).toBe(".article-body{/* { */ a{color:red}}");
  });

  it("drops empty rules and rules whose braces do not balance", () => {
    expect(scopeArticleCss("   ")).toBe("");
    expect(scopeArticleCss("a{color:red")).toBe("");
    expect(scopeArticleCss("}body{color:red}{")).toBe("");
  });
});
