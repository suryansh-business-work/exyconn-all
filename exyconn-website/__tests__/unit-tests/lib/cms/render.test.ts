/** What a CMS page's components can read besides their props, and the fragments' CSS. */
import { describe, expect, it } from "vitest";
import * as cms from "../../../../src/lib/cms";
import { fragmentsCss, renderContext } from "../../../../src/lib/cms/render";
import type { CmsFragment } from "../../../../src/lib/cms/types";
import { BRANDING_FALLBACK } from "../../../../src/lib/portal";

const fragment = (id: string, css: string): CmsFragment => ({
  id,
  css,
  blocks: [{ kind: "html", html: `<div>${id}</div>` }],
});

describe("renderContext", () => {
  it("passes everything through and indexes the fragments' blocks by id", () => {
    const header = fragment("header", ".h{}");
    const detail = { key: "blog.article", item: { slug: "x" } };
    const context = renderContext(
      "site-1",
      BRANDING_FALLBACK,
      { serviceCount: "3" },
      { slug: "x" },
      [header],
      "exyconn",
      detail
    );
    expect(context).toMatchObject({
      siteId: "site-1",
      branding: BRANDING_FALLBACK,
      variables: { serviceCount: "3" },
      params: { slug: "x" },
      site: "exyconn",
      detail,
    });
    expect(context.fragments.get("header")).toBe(header.blocks);
    expect(context.fragments.size).toBe(1);
  });

  it("works without fragments or a detail", () => {
    const context = renderContext("s", BRANDING_FALLBACK, {}, {}, [], "k", null);
    expect(context.fragments.size).toBe(0);
    expect(context.detail).toBeNull();
  });
});

describe("fragmentsCss", () => {
  it("joins each fragment's CSS once, in order, skipping empty CSS", () => {
    expect(
      fragmentsCss([
        fragment("a", ".a{}"),
        fragment("empty", ""),
        fragment("b", ".b{}"),
        fragment("a", ".a{}"),
      ])
    ).toBe(".a{}\n.b{}");
    expect(fragmentsCss([])).toBe("");
  });
});

describe("cms entry point", () => {
  it("re-exports the readers and helpers pages import", () => {
    expect(cms.renderContext).toBe(renderContext);
    expect(cms.fragmentsCss).toBe(fragmentsCss);
    expect(typeof cms.getCmsPage).toBe("function");
    expect(typeof cms.getCmsSite).toBe("function");
    expect(typeof cms.getCmsPaths).toBe("function");
    expect(typeof cms.getCmsPreview).toBe("function");
    expect(cms.safeCss("</style>")).toBe(String.raw`<\/style>`);
    expect(cms.designSystemCss(null)).toBe("");
    expect(cms.fillCopy("{a}", { a: "1" })).toBe("1");
    expect(cms.fillJsonLd("{a}", { a: "1" })).toBe("1");
    expect(cms.withPaths(["/a"], ["/a", "/b"])).toEqual(["/a", "/b"]);
    expect(typeof cms.cmsVariables).toBe("function");
    expect(typeof cms.publishedPaths).toBe("function");
  });
});
