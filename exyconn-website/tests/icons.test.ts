import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { scale } from "../src/styles/tokens/scale.tokens";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));
const read = (file: string): string => readFileSync(SRC + file, "utf8");

/** The site chrome every page renders: its icons are where inconsistency shows first. */
const CHROME = [
  "components/header-and-footer/Header.astro",
  "components/header-and-footer/MobileHeader.astro",
  "components/header-and-footer/Footer.astro",
  "components/ThemeToggle.astro",
  "components/SearchModal.astro",
  "components/MarketPicker.astro",
];

/** Every Font Awesome `<i>` tag in a file, attributes and all, however it is wrapped. */
const iconTags = (text: string): string[] =>
  [...text.matchAll(/<i\b[^>]*>/g)].map((m) => m[0]).filter((tag) => tag.includes("fa-"));

const remToPx = (value: string): number => Number.parseFloat(value) * 16;

describe("icon size scale", () => {
  const steps = Object.entries(scale["icon-size"]);

  it("runs smallest to largest, and starts no smaller than 12px", () => {
    const sizes = steps.map(([, value]) => remToPx(value));
    expect(sizes).toEqual(sizes.toSorted((a, b) => a - b));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(12);
  });

  it("has a utility in global.css for every step", () => {
    const css = read("styles/global.css");
    const missing = steps
      .map(([step]) => step)
      .filter((step) => !css.includes(`@utility icon-${step} {`));
    expect(missing).toEqual([]);
  });
});

describe("icons in the site chrome", () => {
  const tags = CHROME.flatMap((file) => iconTags(read(file)).map((tag) => [file, tag] as const));

  it("finds the icons to check", () => {
    expect(tags.length).toBeGreaterThan(40);
  });

  it("size every icon from the scale", () => {
    const unsized = tags.filter(([, tag]) => !/\bicon-(?:xs|sm|md|lg|xl)\b/.test(tag));
    expect(unsized).toEqual([]);
  });

  it("hide every icon from assistive technology", () => {
    const announced = tags.filter(([, tag]) => !tag.includes('aria-hidden="true"'));
    expect(announced).toEqual([]);
  });
});
