// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupRail, setupReveal } from "../../../../src/scripts/home3d/ui";
import { installIntersectionObserver, lastObserver } from "../script-dom";

const MARKUP = `
  <div id="stage">
    <nav>
      <a id="rail-hero" data-rail-link href="#hero">Hero</a>
      <a id="rail-jets" data-rail-link href="#jets">Jets</a>
    </nav>
    <section id="hero" data-chapter><h2 id="line-1" data-reveal-line>Build</h2></section>
    <section id="jets" data-chapter><h2 id="line-2" data-reveal-line>Fly</h2></section>
  </div>
`;

const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

beforeEach(() => {
  installIntersectionObserver();
  document.body.innerHTML = MARKUP;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("setupReveal", () => {
  it("reveals each heading once as it enters and marks the stage ready", () => {
    const stop = setupReveal(byId("stage"));
    const observer = lastObserver();
    expect(byId("stage").dataset.revealReady).toBe("");
    expect(observer.options).toEqual({ rootMargin: "0px 0px -12% 0px" });
    expect([...observer.observed]).toEqual([byId("line-1"), byId("line-2")]);

    observer.emit([byId("line-2")], false);
    expect(byId("line-2").classList.contains("is-revealed")).toBe(false);

    observer.emit([byId("line-1")]);
    expect(byId("line-1").classList.contains("is-revealed")).toBe(true);
    expect(observer.unobserve).toHaveBeenCalledWith(byId("line-1"));

    stop();
    expect(observer.disconnect).toHaveBeenCalled();
  });
});

describe("setupRail", () => {
  it("marks the rail link of the chapter in view as current", () => {
    const chapters = [byId("hero"), byId("jets")];
    const stop = setupRail(byId("stage"), chapters);
    const observer = lastObserver();
    expect([...observer.observed]).toEqual(chapters);

    observer.emit([byId("hero")]);
    expect(byId("rail-hero").getAttribute("aria-current")).toBe("true");
    expect(byId("rail-jets").hasAttribute("aria-current")).toBe(false);

    observer.emit([byId("hero")], false);
    expect(byId("rail-hero").getAttribute("aria-current")).toBe("true");

    observer.emit([byId("jets")]);
    expect(byId("rail-hero").hasAttribute("aria-current")).toBe(false);
    expect(byId("rail-jets").getAttribute("aria-current")).toBe("true");

    stop();
    expect(observer.disconnect).toHaveBeenCalled();
  });
});
