import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ metadata: vi.fn() }));
vi.mock("sharp", () => ({
  default: Object.assign(() => ({ metadata: mocks.metadata }), {
    kernel: { lanczos3: "lanczos3" },
  }),
}));

import { upscaleImage } from "../services";

describe("upscaleImage", () => {
  it.each([
    ["width", { height: 10 }],
    ["height", { width: 10 }],
    ["both dimensions", {}],
  ])("refuses an image whose %s cannot be read", async (_name, metadata) => {
    mocks.metadata.mockResolvedValue(metadata);

    await expect(
      upscaleImage(Buffer.from("x"), 2, "image/png"),
    ).rejects.toThrow("Could not read image dimensions");
  });
});
