import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (file: string): string => readFileSync(ROOT + file, "utf8");

/** The one icon mark — no wordmark — every Exyconn tab shows; the shell's copy is the source. */
const ICON = "packages/shell/public/exyconn-icon.svg";

describe("favicon", () => {
  it.each(["exyconn-website/public/favicon.svg", "exyconn-tools/ui/public/exyconn-icon.svg"])(
    "%s is the shared icon, byte for byte",
    (copy) => {
      expect(read(copy)).toBe(read(ICON));
    }
  );

  it("frames the mark in a square, so a browser tab never squeezes or clips it", () => {
    const viewBox = /viewBox="([^"]+)"/.exec(read(ICON))?.[1].split(/\s+/).map(Number);
    expect(viewBox).toHaveLength(4);
    const [, , width, height] = viewBox ?? [];
    expect(width).toBe(height);
  });
});

describe("mobile menu", () => {
  it("is rendered outside the header, whose backdrop-filter would contain its fixed layout", () => {
    const header = read("exyconn-website/src/components/header-and-footer/Header.astro");
    expect(header.indexOf("<MobileHeader")).toBeGreaterThan(header.indexOf("</header>"));
  });
});
