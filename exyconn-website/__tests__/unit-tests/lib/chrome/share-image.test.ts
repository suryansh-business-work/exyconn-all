/** shareImage: link-preview images are 1200×630, ImageKit is asked to make them so. */
import { describe, expect, it } from "vitest";
import {
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
  shareImage,
} from "../../../../src/lib/chrome/share-image";

const SIZE = { width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT };

describe("shareImage on ImageKit", () => {
  it("pads the image into a 1200x630 JPEG on the brand background", () => {
    const image = shareImage("https://ik.imagekit.io/exy/logo.png?v=2", "Exyconn", "#0a0f1e");
    expect(image).toEqual({ ...SIZE, type: "image/jpeg", alt: "Exyconn", url: expect.any(String) });
    const url = new URL(image.url);
    expect(url.searchParams.get("v")).toBe("2");
    expect(url.searchParams.get("tr")).toBe("w-1200,h-630,cm-pad_resize,bg-0A0F1E,f-jpg");
  });

  it.each(["", "red", "#abc", "#12345g"])(
    "leaves the padding to ImageKit when the background %j is not a 6-digit hex",
    (background) => {
      const { url } = shareImage("https://ik.imagekit.io/exy/a.png", "", background);
      expect(new URL(url).searchParams.get("tr")).toBe("w-1200,h-630,cm-pad_resize,f-jpg");
    }
  );
});

describe("shareImage elsewhere", () => {
  it.each([
    ["https://images.unsplash.com/photo-1?fm=WEBP&w=1200", "image/webp"],
    ["https://images.pexels.com/p.jpeg?format=png", "image/png"],
    ["https://cdn.example.com/a/cover.JPG", "image/jpeg"],
    ["https://cdn.example.com/a/cover.gif", "image/gif"],
    ["https://cdn.example.com/a/cover.svg", "image/svg+xml"],
    ["https://cdn.example.com/a/cover", ""],
    ["https://cdn.example.com/a/cover.tiff", ""],
  ])("keeps %s as given and declares its type as %j", (url, type) => {
    expect(shareImage(url, "Cover", "#000000")).toEqual({ ...SIZE, url, type, alt: "Cover" });
  });
});
