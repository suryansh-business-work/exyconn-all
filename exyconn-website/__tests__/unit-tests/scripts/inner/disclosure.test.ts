// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { openFrom } from "../../../../src/scripts/inner/disclosure";
import { stubMatchMedia } from "../script-dom";

const details = () => document.createElement("details");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("openFrom", () => {
  it("opens the disclosure at once on a wide enough screen", () => {
    const media = stubMatchMedia(true);
    const sheet = details();
    openFrom(sheet, "(min-width: 768px)");
    expect(media.query).toHaveBeenCalledWith("(min-width: 768px)");
    expect(sheet.open).toBe(true);
  });

  it("stays a closed disclosure on phones until the screen widens", () => {
    const media = stubMatchMedia(false);
    const sheet = details();
    openFrom(sheet, "(min-width: 768px)");
    expect(sheet.open).toBe(false);
    media.change(true);
    expect(sheet.open).toBe(true);
  });

  it("leaves the reader's choice alone when the screen narrows again", () => {
    const media = stubMatchMedia(true);
    const sheet = details();
    openFrom(sheet, "(min-width: 1024px)");
    media.change(false);
    expect(sheet.open).toBe(true);
  });
});
