import request from "supertest";
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ removeBackgroundFromDataUrl: vi.fn() }));
vi.mock("../../logo-maker/services", () => ({
  removeBackgroundFromDataUrl: mocks.removeBackgroundFromDataUrl,
}));

import { mountRouter } from "../../../__tests__/helpers/mountRouter";
import routes from "../routes";

const app = mountRouter(routes);
const png = () =>
  sharp({
    create: {
      width: 2,
      height: 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

beforeEach(() => {
  mocks.removeBackgroundFromDataUrl.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("POST /upscale", () => {
  it("needs an image, and ignores a file that is not one", async () => {
    const none = await request(app).post("/upscale").field("scale", "2");
    const text = await request(app)
      .post("/upscale")
      .field("scale", "2")
      .attach("image", Buffer.from("hello"), {
        filename: "a.txt",
        contentType: "text/plain",
      });

    expect(none.status).toBe(400);
    expect(none.body).toEqual({ error: "No image file provided" });
    expect(text.status).toBe(400);
  });

  it("accepts only a scale of 2 or 4", async () => {
    const res = await request(app)
      .post("/upscale")
      .field("scale", "3")
      .attach("image", await png(), {
        filename: "a.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "scale must be '2' or '4'" });
  });

  it("answers 500 when the file is not a readable image", async () => {
    const res = await request(app)
      .post("/upscale")
      .field("scale", "2")
      .attach("image", Buffer.from("not an image"), {
        filename: "a.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to upscale image");
  });
});

describe("POST /remove-background", () => {
  const send = (body: object) =>
    request(app).post("/remove-background").send(body);

  it("returns the cut-out data URL", async () => {
    mocks.removeBackgroundFromDataUrl.mockResolvedValue(
      "data:image/png;base64,AA==",
    );

    const res = await send({ image: "data:image/png;base64,QQ==" });

    expect(res.body).toEqual({
      success: true,
      image: "data:image/png;base64,AA==",
    });
  });

  it("rejects a missing or malformed image", async () => {
    mocks.removeBackgroundFromDataUrl.mockResolvedValue(null);

    const missing = await send({});
    const malformed = await send({ image: "nope" });

    expect(missing.body).toEqual({ error: "No image data provided" });
    expect(malformed.status).toBe(400);
    expect(malformed.body).toEqual({ error: "Invalid image data format" });
  });

  it("answers 500 when the engine fails", async () => {
    mocks.removeBackgroundFromDataUrl.mockRejectedValue(
      new Error("engine down"),
    );

    const res = await send({ image: "data:image/png;base64,QQ==" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Failed to remove background",
      message: "engine down",
    });
  });
});
