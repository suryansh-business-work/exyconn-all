import { describe, expect, it } from "vitest";
import { detectImageType, safeFileName, toolsFolder } from "../image-upload";

const ascii = (text: string) => Buffer.from(text, "latin1");

describe("detectImageType", () => {
  it.each([
    [
      "image/png",
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]),
      "png",
    ],
    ["image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "jpg"],
    ["image/gif", ascii("GIF87a..."), "gif"],
    ["image/gif", ascii("GIF89a..."), "gif"],
    [
      "image/webp",
      Buffer.concat([
        ascii("RIFF"),
        Buffer.from([1, 2, 3, 4]),
        ascii("WEBPVP8 "),
      ]),
      "webp",
    ],
  ])("accepts %s whose bytes agree", (mime, bytes, extension) => {
    expect(detectImageType(mime, bytes)?.extension).toBe(extension);
  });

  it("refuses a type whose bytes belong to another format, or one it does not take", () => {
    expect(detectImageType("image/png", ascii("GIF89a..."))).toBeUndefined();
    expect(detectImageType("image/gif", ascii("GIF90a..."))).toBeUndefined();
    expect(
      detectImageType("image/webp", ascii("RIFF....WAVE")),
    ).toBeUndefined();
    expect(detectImageType("image/svg+xml", ascii("<svg/>"))).toBeUndefined();
  });
});

describe("toolsFolder", () => {
  it("keeps only plain segments, at most three, under /tools", () => {
    expect(toolsFolder("/a/b/c/d")).toBe("/tools/a/b/c");
    expect(toolsFolder("/tools/x")).toBe("/tools/x");
    expect(toolsFolder("../etc/passwd")).toBe("/tools/etc/passwd");
  });

  it("falls back to /tools for anything that is not a string", () => {
    expect(toolsFolder(undefined)).toBe("/tools");
    expect(toolsFolder(["a"])).toBe("/tools");
  });
});

describe("safeFileName", () => {
  it("drops the extension and unsafe characters, and names an empty result 'image'", () => {
    expect(safeFileName("my logo (1).jpeg", "png")).toBe("my_logo__1_.png");
    expect(safeFileName("", "webp")).toBe("image.webp");
    expect(safeFileName(42, "gif")).toBe("image.gif");
  });
});
