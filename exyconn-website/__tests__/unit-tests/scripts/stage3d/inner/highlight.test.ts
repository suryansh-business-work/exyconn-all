// @vitest-environment jsdom
/** Highlight requests: the page event, and hover or focus on `[data-stage-highlight]`. */
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { highlightStage } from "../../../../../src/scripts/stage3d/events";
import { listenForHighlights } from "../../../../../src/scripts/stage3d/inner/highlight";

let onTag: Mock<(tag: number) => void>;
let stop: () => void;
let card: HTMLElement;
let label: HTMLElement;
let button: HTMLButtonElement;
let outside: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = `
    <article data-stage-highlight="2"><span>Cloud</span><button type="button">Read</button></article>
    <p>Elsewhere</p>
    <div data-stage-highlight="soon"><span>Coming</span></div>`;
  card = document.querySelector<HTMLElement>("article")!;
  label = card.querySelector<HTMLElement>("span")!;
  button = card.querySelector("button")!;
  outside = document.querySelector<HTMLElement>("p")!;
  onTag = vi.fn<(tag: number) => void>();
  stop = listenForHighlights(onTag);
});

afterEach(() => {
  stop();
  document.body.innerHTML = "";
});

const pointer = (type: "pointerover" | "pointerout", target: Element, related?: Element) =>
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, relatedTarget: related ?? null }));

describe("listenForHighlights", () => {
  it("passes on the tag of a highlightStage event, and −1 for none", () => {
    highlightStage(5);
    highlightStage(null);
    expect(onTag.mock.calls).toEqual([[5], [-1]]);
  });

  it("lights the card's tag when the pointer enters any part of it", () => {
    pointer("pointerover", label);
    expect(onTag).toHaveBeenCalledWith(2);
  });

  it("asks for no highlight when the attribute is not a tag", () => {
    pointer("pointerover", document.querySelector("div span")!);
    expect(onTag).toHaveBeenCalledWith(-1);
  });

  it("ignores the pointer over elements outside any highlight", () => {
    pointer("pointerover", outside);
    pointer("pointerout", outside, card);
    expect(onTag).not.toHaveBeenCalled();
  });

  it("keeps the highlight while the pointer moves within the card", () => {
    pointer("pointerout", label, button);
    expect(onTag).not.toHaveBeenCalled();
  });

  it("clears the highlight when the pointer leaves the card or the window", () => {
    pointer("pointerout", label, outside);
    pointer("pointerout", card);
    expect(onTag.mock.calls).toEqual([[-1], [-1]]);
  });

  it("follows keyboard focus into and out of the card", () => {
    button.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(onTag).toHaveBeenLastCalledWith(2);
    button.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: outside }));
    expect(onTag).toHaveBeenLastCalledWith(-1);
    expect(onTag).toHaveBeenCalledTimes(2);
  });

  it("ignores events whose target is not an element", () => {
    document.dispatchEvent(new FocusEvent("focusin"));
    document.dispatchEvent(new FocusEvent("focusout"));
    expect(onTag).not.toHaveBeenCalled();
  });

  it("stops listening once disposed", () => {
    stop();
    highlightStage(1);
    pointer("pointerover", label);
    button.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    expect(onTag).not.toHaveBeenCalled();
  });
});
