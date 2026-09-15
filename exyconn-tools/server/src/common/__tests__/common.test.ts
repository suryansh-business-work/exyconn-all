import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("@imgly/background-removal-node", () => ({
  removeBackground: vi.fn(),
}));

vi.mock("../../shared/services/email", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("../../shared/services/imagekit", () => ({
  TOOLS_FOLDER: "/tools",
  uploadImage: vi.fn(),
  deleteToolsImage: vi.fn(),
}));

import { sendEmail } from "../../shared/services/email";
import { deleteToolsImage, uploadImage } from "../../shared/services/imagekit";
import { createApp } from "../../app";
import { buildSignatureEmail } from "../signature-email";
import { safeFileName, toolsFolder } from "../image-upload";

const sendEmailMock = vi.mocked(sendEmail);
const uploadMock = vi.mocked(uploadImage);
const deleteMock = vi.mocked(deleteToolsImage);

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
]);

beforeEach(() => {
  sendEmailMock.mockReset();
  uploadMock.mockReset();
  deleteMock.mockReset();
});

describe("buildSignatureEmail", () => {
  it("strips script, event handlers and unsafe URLs but keeps signature markup", () => {
    const html = buildSignatureEmail(
      `<table><tr><td style="color: #333; background: url(https://evil.test/x)">
        <a href="javascript:alert(1)">bad</a>
        <a href="mailto:a@b.com">mail</a>
        <img src="http://insecure.test/a.png" onerror="alert(1)">
        <img src="https://ik.imagekit.io/x/logo.png" width="80">
        <script>alert(1)</script>
      </td></tr></table>`,
      `<b>Eve</b>`,
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("url(");
    expect(html).not.toContain("http://insecure.test");
    expect(html).toContain('href="mailto:a@b.com"');
    expect(html).toContain('src="https://ik.imagekit.io/x/logo.png"');
    expect(html).toContain("<table>");
    expect(html).toContain("&lt;b&gt;Eve&lt;/b&gt;");
  });
});

describe("POST /api/common/email/send-signature-test", () => {
  it("rejects more than one recipient", async () => {
    const res = await request(createApp())
      .post("/api/common/email/send-signature-test")
      .send({ to: "a@b.com, c@d.com", signatureHtml: "<p>Hi</p>" });

    expect(res.status).toBe(400);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("sends with a fixed subject and no caller-controlled sender", async () => {
    sendEmailMock.mockResolvedValue({ success: true, messageId: "1" });

    const res = await request(createApp())
      .post("/api/common/email/send-signature-test")
      .send({
        to: "a@b.com",
        signatureHtml: "<p>Hi</p>",
        senderName: "Eve",
        from: "ceo@bank.test",
      });

    expect(res.status).toBe(200);
    const options = sendEmailMock.mock.calls[0][0];
    expect(options.subject).toBe("Your email signature preview");
    expect(options.from).toBeUndefined();
    expect(options.to).toBe("a@b.com");
  });

  it("limits a visitor to three test emails an hour", async () => {
    sendEmailMock.mockResolvedValue({ success: true });
    const app = createApp();
    const send = () =>
      request(app)
        .post("/api/common/email/send-signature-test")
        .send({ to: "a@b.com", signatureHtml: "<p>Hi</p>" });

    for (let i = 0; i < 3; i++) {
      expect((await send()).status).toBe(200);
    }
    expect((await send()).status).toBe(429);
  });

  it("no longer exposes the generic send route", async () => {
    const res = await request(createApp())
      .post("/api/common/email/send")
      .send({ to: "a@b.com", subject: "x", html: "x" });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/common/imagekit/upload", () => {
  it("rejects a file whose bytes are not the image type it claims", async () => {
    const res = await request(createApp())
      .post("/api/common/imagekit/upload")
      .attach("file", Buffer.from("<svg onload=alert(1)>"), {
        filename: "x.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("uploads a real PNG under /tools regardless of the requested folder", async () => {
    uploadMock.mockResolvedValue({
      success: true,
      url: "https://ik.imagekit.io/x.png",
      fileId: "abc",
    });

    const res = await request(createApp())
      .post("/api/common/imagekit/upload")
      .field("folder", "/../../private/email-signatures")
      .field("fileName", "../me.svg")
      .attach("file", PNG, { filename: "me.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    const [, fileName, folder] = uploadMock.mock.calls[0];
    expect(folder).toBe("/tools/private/email-signatures");
    expect(fileName).toBe("___me.png");
  });
});

describe("DELETE /api/common/imagekit/delete/:fileId", () => {
  it("refuses files outside the tools folder", async () => {
    deleteMock.mockResolvedValue("forbidden");
    const res = await request(createApp()).delete(
      "/api/common/imagekit/delete/abc123",
    );
    expect(res.status).toBe(403);
  });

  it("rejects a malformed id", async () => {
    const res = await request(createApp()).delete(
      "/api/common/imagekit/delete/a.b",
    );
    expect(res.status).toBe(400);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});

describe("upload naming helpers", () => {
  it("confines folders under /tools", () => {
    expect(toolsFolder("/email-signatures/photos")).toBe(
      "/tools/email-signatures/photos",
    );
    expect(toolsFolder("../../etc")).toBe("/tools/etc");
    expect(toolsFolder(undefined)).toBe("/tools");
  });

  it("builds a safe file name with the detected extension", () => {
    expect(safeFileName("my photo.jpeg", "jpg")).toBe("my_photo.jpg");
    expect(safeFileName("", "png")).toBe("image.png");
  });
});

describe("app hardening", () => {
  it("answers /health with a bare status", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("sends helmet's security headers", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
