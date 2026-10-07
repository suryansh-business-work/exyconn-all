// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HIGHLIGHT_EVENT,
  highlightStage,
  type HighlightDetail,
} from "../../../../src/scripts/stage3d/events";

const heard = vi.fn((event: Event) => (event as CustomEvent<HighlightDetail>).detail);

beforeEach(() => {
  document.addEventListener(HIGHLIGHT_EVENT, heard);
});

afterEach(() => {
  document.removeEventListener(HIGHLIGHT_EVENT, heard);
  heard.mockClear();
});

describe("highlightStage", () => {
  it("tells the stage on the document which tag to light", () => {
    highlightStage(2);
    expect(heard).toHaveBeenCalledTimes(1);
    expect(heard.mock.results[0].value).toEqual({ tag: 2 });
  });

  it("asks for no highlight with null", () => {
    highlightStage(null);
    expect(heard.mock.results[0].value).toEqual({ tag: -1 });
  });

  it("keeps tag 0, which is a real tag", () => {
    highlightStage(0);
    expect(heard.mock.results[0].value).toEqual({ tag: 0 });
  });
});
