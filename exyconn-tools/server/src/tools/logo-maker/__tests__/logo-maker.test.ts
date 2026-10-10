import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ removeBackground: vi.fn() }));
vi.mock("@imgly/background-removal-node", () => ({
  removeBackground: mocks.removeBackground,
}));

import { mountRouter } from "../../../__tests__/helpers/mountRouter";
import routes from "../routes";
import { removeBackgroundFromDataUrl } from "../services";

const app = mountRouter(routes);
const PNG_B64 = Buffer.from("png-bytes").toString("base64");
const DATA_URL = `data:image/png;base64,${PNG_B64}`;
const RESULT = Buffer.from("cutout");
const RESULT_URL = `data:image/png;base64,${RESULT.toString("base64")}`;

beforeEach(() => {
  mocks.removeBackground.mockReset();
  mocks.removeBackground.mockImplementation(
    async (
      _blob: Blob,
      options: { progress: (k: string, c: number, t: number) => void },
    ) => {
      options.progress("compute:inference", 1, 4);
      return new Blob([RESULT]);
    },
  );
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("removeBackgroundFromDataUrl", () => {
  it("returns the cut-out as a PNG data URL and logs progress", async () => {
    await expect(removeBackgroundFromDataUrl(DATA_URL)).resolves.toBe(
      RESULT_URL,
    );

    const [blob] = mocks.removeBackground.mock.calls[0] as [Blob];
    expect(blob.type).toBe("image/png");
    expect(Buffer.from(await blob.arrayBuffer()).toString()).toBe("png-bytes");
    expect(console.log).toHaveBeenCalledWith(
      "Progress [compute:inference]: 25%",
    );
  });

  it("returns null for anything that is not an image data URL", async () => {
    await expect(
      removeBackgroundFromDataUrl("https://a.test/x.png"),
    ).resolves.toBeNull();
    await expect(
      removeBackgroundFromDataUrl("data:text/plain;base64,aGk="),
    ).resolves.toBeNull();
    expect(mocks.removeBackground).not.toHaveBeenCalled();
  });
});

describe("POST /remove-background", () => {
  it("cuts out an uploaded image", async () => {
    const res = await request(app)
      .post("/remove-background")
      .attach("image", Buffer.from("png-bytes"), {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, image: RESULT_URL });
    const [blob] = mocks.removeBackground.mock.calls[0] as [Blob];
    expect(blob.type).toBe("image/png");
    expect(console.log).toHaveBeenCalledWith(
      "Progress [compute:inference]: 25%",
    );
  });

  it("needs a file", async () => {
    const res = await request(app).post("/remove-background").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "No image file provided" });
  });

  it("answers 500 without leaking the engine's message in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.removeBackground.mockRejectedValue(
      new Error("onnx session failed at /srv/model"),
    );

    const res = await request(app)
      .post("/remove-background")
      .attach("image", Buffer.from("x"), {
        filename: "a.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Failed to remove background",
      message: "Unknown error",
    });
  });
});

describe("POST /remove-background-base64", () => {
  it("cuts out an image sent as a data URL", async () => {
    const res = await request(app)
      .post("/remove-background-base64")
      .send({ image: DATA_URL });

    expect(res.body).toEqual({ success: true, image: RESULT_URL });
  });

  it("rejects a missing image and a malformed data URL", async () => {
    const missing = await request(app)
      .post("/remove-background-base64")
      .send({});
    const malformed = await request(app)
      .post("/remove-background-base64")
      .send({ image: "nope" });

    expect(missing.body).toEqual({ error: "No image data provided" });
    expect(malformed.status).toBe(400);
    expect(malformed.body).toEqual({ error: "Invalid image data format" });
  });

  it("answers 500 when the engine fails", async () => {
    mocks.removeBackground.mockRejectedValue(new Error("out of memory"));

    const res = await request(app)
      .post("/remove-background-base64")
      .send({ image: DATA_URL });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Failed to remove background",
      message: "out of memory",
    });
  });
});

describe("POST /remove-background-removebg", () => {
  const send = (body: object) =>
    request(app).post("/remove-background-removebg").send(body);

  function remoteReplies(
    response: Partial<Response> & { ok: boolean; status: number },
  ) {
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("sends the image to Remove.bg with the visitor's key and returns the cut-out", async () => {
    const fetchMock = remoteReplies({
      ok: true,
      status: 200,
      arrayBuffer: async () => new Uint8Array(RESULT).buffer,
    });

    const res = await send({ image: DATA_URL, apiKey: "KEY" });

    expect(res.body).toEqual({ success: true, image: RESULT_URL });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.remove.bg/v1.0/removebg",
      {
        method: "POST",
        headers: { "X-Api-Key": "KEY", "Content-Type": "application/json" },
        body: JSON.stringify({ image_file_b64: PNG_B64, size: "auto" }),
      },
    );
  });

  it("validates the image and the key before calling out", async () => {
    const fetchMock = remoteReplies({ ok: true, status: 200 });

    const noImage = await send({ apiKey: "KEY" });
    const noKey = await send({ image: DATA_URL });
    const badImage = await send({ image: "nope", apiKey: "KEY" });

    expect(noImage.body).toEqual({ error: "No image data provided" });
    expect(noKey.body).toEqual({ error: "No Remove.bg API key provided" });
    expect(badImage.body).toEqual({ error: "Invalid image data format" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes on Remove.bg's own error title and status", async () => {
    remoteReplies({
      ok: false,
      status: 402,
      text: async () =>
        JSON.stringify({ errors: [{ title: "Insufficient credits" }] }),
    });

    const res = await send({ image: DATA_URL, apiKey: "KEY" });

    expect(res.status).toBe(402);
    expect(res.body).toEqual({
      error: "Remove.bg API error",
      message: "Insufficient credits",
    });
  });

  it("falls back to the raw text, then to a generic message, when the error is not JSON", async () => {
    remoteReplies({ ok: false, status: 502, text: async () => "Bad gateway" });
    const raw = await send({ image: DATA_URL, apiKey: "KEY" });
    expect(raw.body.message).toBe("Bad gateway");

    remoteReplies({ ok: false, status: 500, text: async () => "" });
    const empty = await send({ image: DATA_URL, apiKey: "KEY" });
    expect(empty.body.message).toBe("Remove.bg API error");

    remoteReplies({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ errors: [] }),
    });
    const noTitle = await send({ image: DATA_URL, apiKey: "KEY" });
    expect(noTitle.body.message).toBe("Remove.bg API error");
  });

  it("answers 500 when the request itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const res = await send({ image: DATA_URL, apiKey: "KEY" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Failed to remove background",
      message: "network down",
    });
  });
});
