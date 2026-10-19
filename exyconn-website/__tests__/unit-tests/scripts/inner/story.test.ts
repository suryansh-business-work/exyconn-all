// @vitest-environment jsdom
/** Scroll stories: the step in the middle band is active and lights its tag; leaving clears it. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HIGHLIGHT_EVENT, type HighlightDetail } from "../../../../src/scripts/stage3d/events";
import { bootStories } from "../../../../src/scripts/inner/story";
import { FakeIntersectionObserver, installIntersectionObserver } from "../script-dom";

let highlights: number[];
const onHighlight = (event: Event) =>
  highlights.push((event as CustomEvent<HighlightDetail>).detail.tag);

const step = (id: string) => document.getElementById(id) as HTMLElement;
const active = () => [...document.querySelectorAll("[data-active]")].map((element) => element.id);

beforeEach(() => {
  highlights = [];
  installIntersectionObserver();
  document.addEventListener(HIGHLIGHT_EVENT, onHighlight);
  document.body.innerHTML = `
    <section id="story" data-stage-story>
      <ol>
        <li id="one" data-story-step="1">One</li>
        <li id="two" data-story-step="2">Two</li>
        <li id="odd" data-story-step="">Untagged</li>
      </ol>
    </section>
    <section id="plain"><li data-story-step="9">Not a story</li></section>`;
  bootStories();
});
afterEach(() => {
  document.removeEventListener(HIGHLIGHT_EVENT, onHighlight);
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

const [stepsObserver, storyObserver] = [0, 1].map(
  (index) => () => FakeIntersectionObserver.instances[index]
);

describe("bootStories", () => {
  it("watches each step of a story through a band across the middle of the screen", () => {
    expect(FakeIntersectionObserver.instances).toHaveLength(2);
    expect([...stepsObserver().observed].map((element) => element.id)).toEqual([
      "one",
      "two",
      "odd",
    ]);
    expect(stepsObserver().options).toEqual({ rootMargin: "-45% 0px -45% 0px" });
    expect([...storyObserver().observed]).toEqual([step("story")]);
  });

  it("marks the step entering the band active and lights its tag", () => {
    stepsObserver().emit([step("one")]);
    expect(active()).toEqual(["one"]);
    stepsObserver().callback([
      { target: step("one"), isIntersecting: false },
      { target: step("two"), isIntersecting: true },
    ]);
    expect(active()).toEqual(["two"]);
    expect(highlights).toEqual([1, 2]);
  });

  it("ignores steps that only leave the band", () => {
    stepsObserver().emit([step("one")]);
    stepsObserver().emit([step("one")], false);
    expect(active()).toEqual(["one"]);
    expect(highlights).toEqual([1]);
  });

  it("lights nothing (-1) for a step without a tag", () => {
    stepsObserver().emit([step("odd")]);
    expect(active()).toEqual(["odd"]);
    expect(highlights).toEqual([-1]);
  });

  it("clears the active step and the light once the story leaves the screen", () => {
    stepsObserver().emit([step("two")]);
    storyObserver().emit([step("story")]);
    expect(active()).toEqual(["two"]);
    storyObserver().emit([step("story")], false);
    expect(active()).toEqual([]);
    expect(highlights).toEqual([2, -1]);
  });
});
