import { describe, expect, it } from "vitest";
import { sizedImage } from "../../src/lib/chrome/sized-image";

describe("sizedImage", () => {
  it("asks ImageKit for twice the drawn height", () => {
    expect(sizedImage("https://ik.imagekit.io/acme/branding/logo.png", 32)).toBe(
      "https://ik.imagekit.io/acme/branding/logo.png?tr=h-64"
    );
  });

  it("replaces a transform the upload URL already carries", () => {
    expect(sizedImage("https://ik.imagekit.io/acme/logo.png?tr=w-1200", 40)).toBe(
      "https://ik.imagekit.io/acme/logo.png?tr=h-80"
    );
  });

  it("leaves SVGs and other hosts as given", () => {
    expect(sizedImage("https://ik.imagekit.io/acme/logo.SVG", 32)).toBe(
      "https://ik.imagekit.io/acme/logo.SVG"
    );
    expect(sizedImage("https://cdn.example.com/logo.png", 32)).toBe(
      "https://cdn.example.com/logo.png"
    );
  });
});
