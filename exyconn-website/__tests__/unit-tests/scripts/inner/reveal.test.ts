// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootReveals } from "../../../../src/scripts/inner/reveal";
import { FakeIntersectionObserver, installIntersectionObserver } from "../script-dom";

const root = document.documentElement;
const byId = (id: string) => document.getElementById(id) as HTMLElement;
const observers = () => FakeIntersectionObserver.instances;

beforeEach(() => {
  installIntersectionObserver();
  document.body.innerHTML = `
    <section class="inner-section"><h2 id="line" data-reveal-line>Why</h2></section>
    <h2 id="hero-line" data-reveal-line>Hero heading</h2>
    <figure id="arch" class="inner-arch"></figure>
  `;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete root.dataset.innerReveal;
  document.body.innerHTML = "";
});

describe("bootReveals", () => {
  it("reveals body chapter headings as they enter, but not the hero's", () => {
    bootReveals();
    const [lines] = observers();
    expect([...lines.observed]).toEqual([byId("line")]);
    lines.emit([byId("line")]);
    expect(byId("line").classList.contains("is-revealed")).toBe(true);
    expect(byId("hero-line").classList.contains("is-revealed")).toBe(false);
  });

  it("arms architecture diagrams and reveals them as they enter", () => {
    bootReveals();
    const diagrams = observers()[1];
    expect(byId("arch").dataset.revealReady).toBe("");
    expect([...diagrams.observed]).toEqual([byId("arch")]);
    diagrams.emit([byId("arch")]);
    expect(byId("arch").classList.contains("is-revealed")).toBe(true);
  });

  it("arms the page only once", () => {
    bootReveals();
    bootReveals();
    expect(root.dataset.innerReveal).toBe("");
    expect(observers()).toHaveLength(2);
  });
});
