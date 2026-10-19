// @vitest-environment jsdom
/**
 * The in-page checks against hand-built pages. jsdom does no layout, so each element's box
 * comes from its `data-rect="left,top,width,height"` (none = not rendered) and a glyph's
 * `::before` content from `data-before`; everything else is real DOM and computed style.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { focusSnapshot, inPageChecks } from "../../../scripts/a11y-audit/page-checks.mjs";

const realStyle = globalThis.getComputedStyle.bind(globalThis);
let animations: unknown[] = [];
let pointed: Element | null = null;

function boxOf(element: Element): DOMRect {
  const rect = element.getAttribute("data-rect");
  if (!rect) {
    return new DOMRect(0, 0, 0, 0);
  }
  const [left, top, width, height] = rect.split(",").map(Number);
  return new DOMRect(left, top, width, height);
}

function setViewport(width: number, scrollWidth = width) {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(document.documentElement, "scrollWidth", {
    configurable: true,
    value: scrollWidth,
  });
}

const page = (html: string) => {
  document.body.innerHTML = html;
};

beforeEach(() => {
  animations = [];
  pointed = null;
  setViewport(1000);
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    return boxOf(this);
  });
  vi.spyOn(globalThis, "getComputedStyle").mockImplementation((element, pseudo) =>
    pseudo
      ? ({ content: element.getAttribute("data-before") ?? "none" } as CSSStyleDeclaration)
      : realStyle(element)
  );
  Object.assign(document, {
    getAnimations: () => animations,
    elementFromPoint: () => pointed,
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute("lang");
  document.documentElement.removeAttribute("dir");
  document.title = "";
});

describe("page facts", () => {
  it("reports language, title, headings, landmarks, the skip link and horizontal scroll", () => {
    document.documentElement.lang = "de-DE";
    document.documentElement.dir = "ltr";
    document.title = "Kontakt";
    setViewport(375, 400);
    page(`
      <header><nav aria-label="Main"></nav></header>
      <a href="#main-content">Skip</a>
      <main><h1>One</h1><h1>Two</h1><nav></nav></main>
      <div role="main"></div>
      <footer></footer>`);
    const result = inPageChecks();
    expect(result).toMatchObject({
      lang: "de-DE",
      dir: "ltr",
      title: "Kontakt",
      h1Count: 2,
      landmarks: { main: 2, banner: 1, contentinfo: 1, navUnnamed: 1 },
      skipLink: true,
      horizontalScroll: true,
    });
  });

  it("notices a missing skip link and no horizontal scroll", () => {
    page(`<main></main>`);
    expect(inPageChecks()).toMatchObject({ skipLink: false, horizontalScroll: false });
  });
});

describe("target size", () => {
  it("flags small targets that sit closer than 12px to another target", () => {
    page(`
      <button id="close" class="icon btn small extra" data-rect="0,0,20,20">  Close
        menu  </button>
      <a href="/x" aria-label="Next page" style="display:block" data-rect="21,0,20,20">→</a>
      <svg tabindex="0" data-rect="42,0,20,10"></svg>
      <button data-rect="500,500,10,10">Far away</button>
      <button data-rect="0,100,24,24">Big enough</button>`);
    expect(inPageChecks().smallTargets).toEqual([
      { el: 'button#close.icon.btn.small "Close menu"', size: "20x20" },
      { el: 'a "Next page"', size: "20x20" },
      { el: 'svg ""', size: "20x10" },
    ]);
  });

  it("counts a target as small when only its height falls short", () => {
    page(`
      <button data-rect="0,0,40,20">Wide</button>
      <button data-rect="0,21,40,20">Wide too</button>`);
    expect(inPageChecks().smallTargets.map(({ size }) => size)).toEqual(["40x20", "40x20"]);
  });

  it("exempts inline links in running text, but not a link that is the whole line", () => {
    page(`
      <p>Read the whole <a href="/terms" style="display:inline" data-rect="0,0,30,16">terms</a> before you sign.</p>
      <p><a href="/a" style="display:inline" data-rect="0,40,30,16">alone</a></p>
      <span tabindex="0" style="display:inline" data-rect="20,40,10,10">x</span>`);
    expect(inPageChecks().smallTargets.map(({ el }) => el)).toEqual(['a "alone"', 'span "x"']);
  });

  it("does not treat a target and a target inside it as crowding each other", () => {
    page(
      `<summary data-rect="0,0,20,20"><span tabindex="0" data-rect="2,2,10,10">i</span></summary>`
    );
    expect(inPageChecks().smallTargets).toEqual([]);
  });

  it("ignores targets that are not rendered", () => {
    page(`
      <button data-rect="0,0,10,10">Shown</button>
      <button data-rect="12,0,0,10">No width</button>
      <button data-rect="12,0,10,0">No height</button>
      <button style="visibility:hidden" data-rect="12,0,10,10">Hidden</button>
      <button style="display:none" data-rect="12,0,10,10">None</button>
      <button>No box</button>`);
    expect(inPageChecks().smallTargets).toEqual([]);
  });
});

describe("icons", () => {
  it("records each rendered icon's context, size and whether it is announced", () => {
    page(`
      <header><i class="fa-solid fa-star" style="font-size:20px" data-rect="0,0,20,20"></i></header>
      <footer><i class="fa-brands fa-x" data-before='"\\f099" / ""' data-rect="0,0,16,16"></i></footer>
      <button data-rect="0,0,40,40"><svg aria-hidden="true" data-rect="0,0,24.4,24.6"><svg data-rect="0,0,5,5"></svg></svg></button>
      <h2><i class="fa-link" data-rect="0,0,10,10"></i></h2>
      <ul><li><i class="fa-check" data-rect="0,0,10,10"></i></li></ul>
      <section><i class="fa-quote" data-rect="0,0,10,10"></i><i class="fa-gone"></i></section>`);
    expect(inPageChecks().icons).toEqual([
      {
        tag: "i",
        cls: "fa-solid fa-star",
        context: "header",
        fontSize: "20px",
        box: "20x20",
        hidden: false,
        iconOnlyControlWithoutName: false,
      },
      expect.objectContaining({ context: "footer", hidden: true }),
      expect.objectContaining({
        tag: "svg",
        cls: "",
        context: "button",
        box: "24x25",
        hidden: true,
        iconOnlyControlWithoutName: true,
      }),
      expect.objectContaining({ context: "heading" }),
      expect.objectContaining({ context: "list" }),
      expect.objectContaining({ context: "content", hidden: false }),
    ]);
  });

  it("places icons in the first top-level block as the header banner, and links as links", () => {
    page(
      `<div><i class="fa-a" data-rect="0,0,9,9"></i></div><a href="/"><i class="fa-b" data-rect="0,0,9,9"></i></a>`
    );
    expect(inPageChecks().icons.map(({ context }) => context)).toEqual(["header-banner", "link"]);
  });

  it.each([
    ["an aria-label", `<button aria-label="Close" data-rect="0,0,9,9">ICON</button>`, false],
    ["a title", `<button title="Close" data-rect="0,0,9,9">ICON</button>`, false],
    ["its text", `<button data-rect="0,0,9,9">ICON Close</button>`, false],
    ["an image's alt", `<button data-rect="0,0,9,9">ICON<img alt="Close"></button>`, false],
    [
      "screen-reader text",
      `<button data-rect="0,0,9,9">ICON<span class="sr-only">Close</span></button>`,
      false,
    ],
    [
      "visible child text",
      `<button data-rect="0,0,9,9">ICON<span data-rect="0,0,9,9">Close</span></button>`,
      false,
    ],
    [
      "nothing but hidden parts",
      `<button data-rect="0,0,9,9">ICON<!-- c --><span aria-hidden="true">x</span><img><span>unrendered</span></button>`,
      true,
    ],
  ])("names an icon-only control by %s", (_how, html, nameless) => {
    page(html.replace("ICON", `<i class="fa-x" aria-hidden="true" data-rect="0,0,9,9"></i>`));
    expect(inPageChecks().icons[0].iconOnlyControlWithoutName).toBe(nameless);
  });
});

describe("reflow", () => {
  it("lists the outermost elements wider than the viewport, at most 15", () => {
    setViewport(300);
    const wide = Array.from({ length: 16 }, (_, i) => `<p id="w${i}" data-rect="0,0,400,10"></p>`);
    page(`
      <div id="outer" data-rect="0,0,400,10"><span data-rect="0,0,400,10"></span></div>
      <div data-rect="0,0,301,10">edge</div>
      <div inert><p data-rect="0,0,400,10"></p></div>
      <div class="overflow-x-auto"><p data-rect="0,0,400,10"></p></div>
      <table><tbody><tr><td data-rect="0,0,400,10"></td></tr></tbody></table>
      <p style="display:none" data-rect="0,0,400,10"></p>
      ${wide.join("")}`);
    const { overflowing } = inPageChecks();
    expect(overflowing).toHaveLength(15);
    expect(overflowing[0]).toBe('div#outer ""');
    expect(overflowing[1]).toBe('p#w0 ""');
  });
});

describe("headings and links", () => {
  it("reports skipped heading levels among rendered headings", () => {
    page(`
      <h2 data-rect="0,0,9,9">Start</h2>
      <h3 data-rect="0,0,9,9">Fine</h3>
      <h4>Not rendered</h4>
      <h5 data-rect="0,0,9,9">Jump</h5>`);
    expect(inPageChecks().headingSkips).toEqual(['h0->h2 h2 "Start"', 'h3->h5 h5 "Jump"']);
  });

  it("reports link text that leads to more than one place", () => {
    page(`
      <a href="/a" data-rect="0,0,9,9">Read more</a>
      <a href="/b" data-rect="0,0,9,9">read MORE</a>
      <a href="/c" data-rect="0,0,9,9">Pricing</a>
      <a href="/c" data-rect="0,0,9,9">Pricing</a>
      <a href="/d">Pricing</a>`);
    expect(inPageChecks().ambiguousLinks).toEqual(["read more (2 targets)"]);
  });
});

describe("animations", () => {
  it("lists only endless animations that are running", () => {
    page(`<div id="spinner" class="spin">Loading</div>`);
    const target = document.getElementById("spinner");
    const effect = (iterations: number) => ({ getTiming: () => ({ iterations }), target });
    animations = [
      { effect: effect(Infinity), playState: "running" },
      { effect: effect(Infinity), playState: "paused" },
      { effect: effect(1), playState: "running" },
      { effect: null, playState: "running" },
    ];
    expect(inPageChecks().infiniteAnimations).toEqual(['div#spinner.spin "Loading"']);
  });
});

describe("focusSnapshot", () => {
  const focus = (html: string, id = "target") => {
    page(html);
    document.getElementById(id)?.focus();
  };

  it("reports nothing while focus is on the page itself or nowhere", () => {
    page(`<button>One</button>`);
    expect(focusSnapshot()).toBeNull();
    vi.spyOn(document, "activeElement", "get").mockReturnValue(null);
    expect(focusSnapshot()).toBeNull();
  });

  it.each([
    ["a solid outline", "outline-style: solid; outline-width: 2px", true],
    ["a focus ring", "box-shadow: 0 0 0 2px blue", true],
    ["no outline", "outline-style: none; outline-width: 3px; box-shadow: none", false],
    ["a zero-width outline", "outline-style: solid; outline-width: 0px; box-shadow: none", false],
  ])("sees %s as a focus indicator or not", (_what, style, indicator) => {
    focus(`<button id="target" style="${style}">Go</button>`);
    expect(focusSnapshot()).toEqual({ el: 'button#target "Go"', indicator, obscured: false });
  });

  it("names the element by its aria-label, without an id when it has none", () => {
    page(`<a href="/" aria-label="  Home   page ">H</a>`);
    document.querySelector("a")?.focus();
    expect(focusSnapshot()?.el).toBe('a "Home page"');
  });

  it("flags focus covered by a sticky or fixed bar", () => {
    focus(`
      <header style="position: sticky"><span id="bar-item">Menu</span></header>
      <button id="target">Hidden under the bar</button>`);
    pointed = document.getElementById("bar-item");
    expect(focusSnapshot()?.obscured).toBe(true);
  });

  it.each([
    ["nothing", () => null],
    ["the element itself", () => document.getElementById("target")],
    ["something inside it", () => document.getElementById("inner")],
    ["its container", () => document.getElementById("wrap")],
    ["content that is not pinned", () => document.getElementById("other")],
    ["the root element", () => document.documentElement],
  ])("does not flag focus when the point hits %s", (_what, hit) => {
    focus(`
      <div id="wrap"><button id="target"><span id="inner">Go</span></button></div>
      <p id="other">Text</p>
      <nav style="position: fixed"><a id="menu-item" href="/">Item</a><a id="in-bar" href="/b">B</a></nav>`);
    pointed = hit();
    expect(focusSnapshot()?.obscured).toBe(false);
  });

  it("does not flag an element inside the same bar as what covers it", () => {
    focus(
      `<nav style="position: fixed"><a id="menu-item" href="/">Item</a><a id="target" href="/b">B</a></nav>`
    );
    pointed = document.getElementById("menu-item");
    expect(focusSnapshot()?.obscured).toBe(false);
  });
});
