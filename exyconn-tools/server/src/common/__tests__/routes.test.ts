import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  uploadImage: vi.fn(),
  deleteToolsImage: vi.fn(),
}));
vi.mock("../../shared/services/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("../../shared/services/imagekit", () => ({
  TOOLS_FOLDER: "/tools",
  uploadImage: mocks.uploadImage,
  deleteToolsImage: mocks.deleteToolsImage,
}));

import { mountRouter } from "../../__tests__/helpers/mountRouter";
import { createCommonRouter } from "../routes";

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
]);

/** A fresh router per test: the limiters keep their counts per router instance. */
const makeApp = () => mountRouter(createCommonRouter());

beforeEach(() => {
  mocks.sendEmail.mockReset();
  mocks.uploadImage.mockReset();
  mocks.deleteToolsImage.mockReset();
});

describe("POST /imagekit/upload", () => {
  it("needs a file", async () => {
    const res = await request(makeApp())
      .post("/imagekit/upload")
      .field("folder", "x");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: "No file provided" });
  });

  it("answers 502 with the provider result when the upload fails", async () => {
    mocks.uploadImage.mockResolvedValue({
      success: false,
      error: "Upload failed",
    });

    const res = await request(makeApp())
      .post("/imagekit/upload")
      .attach("file", PNG, { filename: "logo.png", contentType: "image/png" });

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ success: false, error: "Upload failed" });
  });

  it("names the stored file after the request's fileName when given, else the upload's", async () => {
    mocks.uploadImage.mockResolvedValue({
      success: true,
      url: "u",
      fileId: "f",
      name: "n",
    });
    const app = makeApp();

    await request(app)
      .post("/imagekit/upload")
      .field("fileName", "Brand Logo.png")
      .field("folder", "/email-signatures/../photos")
      .attach("file", PNG, {
        filename: "original.png",
        contentType: "image/png",
      });
    await request(app).post("/imagekit/upload").attach("file", PNG, {
      filename: "original.png",
      contentType: "image/png",
    });

    expect(mocks.uploadImage.mock.calls.map((call) => call.slice(1))).toEqual([
      ["Brand_Logo.png", "/tools/email-signatures/photos"],
      ["original.png", "/tools"],
    ]);
  });
});

describe("DELETE /imagekit/delete/:fileId", () => {
  it("deletes a file under the tools folder", async () => {
    mocks.deleteToolsImage.mockResolvedValue("deleted");

    const res = await request(makeApp()).delete("/imagekit/delete/abc123");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mocks.deleteToolsImage).toHaveBeenCalledWith("abc123");
  });

  it("answers 403 for a file elsewhere and 502 when the provider fails", async () => {
    const app = makeApp();
    mocks.deleteToolsImage.mockResolvedValueOnce("forbidden");
    const forbidden = await request(app).delete("/imagekit/delete/abc123");
    mocks.deleteToolsImage.mockResolvedValueOnce("failed");
    const failed = await request(app).delete("/imagekit/delete/abc123");

    expect(forbidden.status).toBe(403);
    expect(forbidden.body).toEqual({
      success: false,
      error: "This file cannot be deleted",
    });
    expect(failed.status).toBe(502);
    expect(failed.body).toEqual({ success: false, error: "Delete failed" });
  });
});

describe("POST /email/send-signature-test", () => {
  it("answers 502 with the mailer's result when the send fails", async () => {
    mocks.sendEmail.mockResolvedValue({
      success: false,
      error: "Failed to send email",
    });

    const res = await request(makeApp())
      .post("/email/send-signature-test")
      .send({ to: "a@b.com", signatureHtml: "<p>Hi</p>" });

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ success: false, error: "Failed to send email" });
  });

  it("explains the first thing wrong with a request", async () => {
    const res = await request(makeApp())
      .post("/email/send-signature-test")
      .send({ signatureHtml: "<p>Hi</p>" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.error).toBe("string");
    expect(res.body.error.length).toBeGreaterThan(0);
  });
});
