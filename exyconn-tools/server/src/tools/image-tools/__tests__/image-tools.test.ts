import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import sharp from "sharp";

vi.mock("@imgly/background-removal-node", () => ({
  removeBackground: vi.fn(),
}));

vi.mock("../../logo-maker/services", () => ({
  removeBackgroundFromDataUrl: vi.fn(),
}));

import { removeBackgroundFromDataUrl } from "../../logo-maker/services";
import { createApp } from "../../../app";
import { binaryParser } from "../../../__tests__/helpers/binaryParser";

const app = createApp();

async function makePng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

describe("POST /api/tools/image-tools/upscale", () => {
  it("upscales a PNG 2x with the correct content type", async () => {
    const png = await makePng(4, 6);

    const res = await request(app)
      .post("/api/tools/image-tools/upscale")
      .field("scale", "2")
      .attach("image", png, { filename: "tiny.png", contentType: "image/png" })
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/png");

    const metadata = await sharp(res.body as Buffer).metadata();
    expect(metadata.width).toBe(8);
    expect(metadata.height).toBe(12);
  });

  it("upscales a PNG 4x", async () => {
    const png = await makePng(3, 5);

    const res = await request(app)
      .post("/api/tools/image-tools/upscale")
      .field("scale", "4")
      .attach("image", png, { filename: "tiny.png", contentType: "image/png" })
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    const metadata = await sharp(res.body as Buffer).metadata();
    expect(metadata.width).toBe(12);
    expect(metadata.height).toBe(20);
  });

  it("rejects an invalid scale", async () => {
    const png = await makePng(4, 4);

    const res = await request(app)
      .post("/api/tools/image-tools/upscale")
      .field("scale", "3")
      .attach("image", png, { filename: "tiny.png", contentType: "image/png" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when no image is uploaded", async () => {
    const res = await request(app)
      .post("/api/tools/image-tools/upscale")
      .field("scale", "2");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No image file provided");
  });

  it("returns 413 when the output would exceed 8000px on a side", async () => {
    const png = await makePng(4100, 4);

    const res = await request(app)
      .post("/api/tools/image-tools/upscale")
      .field("scale", "2")
      .attach("image", png, { filename: "wide.png", contentType: "image/png" });

    expect(res.status).toBe(413);
  });
});

describe("POST /api/tools/image-tools/remove-background", () => {
  beforeEach(() => {
    vi.mocked(removeBackgroundFromDataUrl).mockReset();
  });

  it("returns the processed image from the shared service", async () => {
    vi.mocked(removeBackgroundFromDataUrl).mockResolvedValue(
      "data:image/png;base64,UkVTVUxU",
    );

    const res = await request(app)
      .post("/api/tools/image-tools/remove-background")
      .send({ image: "data:image/png;base64,QUJD" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      image: "data:image/png;base64,UkVTVUxU",
    });
    expect(removeBackgroundFromDataUrl).toHaveBeenCalledWith(
      "data:image/png;base64,QUJD",
    );
  });

  it("returns 400 for a malformed data URL", async () => {
    vi.mocked(removeBackgroundFromDataUrl).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/tools/image-tools/remove-background")
      .send({ image: "not-a-data-url" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid image data format");
  });

  it("returns 400 when image is missing", async () => {
    const res = await request(app)
      .post("/api/tools/image-tools/remove-background")
      .send({});

    expect(res.status).toBe(400);
    expect(removeBackgroundFromDataUrl).not.toHaveBeenCalled();
  });
});
