import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
  imagekit: vi.fn(),
  upload: vi.fn(),
  getFileDetails: vi.fn(),
  deleteFile: vi.fn(),
  emailConfig: vi.fn(),
  imageConfig: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: mocks.createTransport },
}));
vi.mock("imagekit", () => ({
  default: class {
    constructor(options: unknown) {
      mocks.imagekit(options);
    }
    upload = mocks.upload;
    getFileDetails = mocks.getFileDetails;
    deleteFile = mocks.deleteFile;
  },
}));
vi.mock("../services/integration-config", () => ({
  getActiveEmailConfig: mocks.emailConfig,
  getActiveImageConfig: mocks.imageConfig,
}));

const EMAIL = {
  host: "smtp.test",
  port: 587,
  secure: false,
  username: "mailer",
  password: "pw",
  fromAddress: "Exyconn <noreply@exyconn.test>",
};
const IMAGE = {
  publicKey: "pub",
  privateKey: "priv",
  urlEndpoint: "https://ik.test/x",
};

beforeEach(() => {
  vi.resetModules();
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail });
  mocks.emailConfig.mockResolvedValue(EMAIL);
  mocks.imageConfig.mockResolvedValue(IMAGE);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("sendEmail", () => {
  it("sends from the bare address of the active account and returns the message id", async () => {
    mocks.sendMail.mockResolvedValue({ messageId: "m-1" });
    const { sendEmail } = await import("../services/email.js");

    const result = await sendEmail({
      to: "a@b.test",
      subject: "Hi",
      text: "Body",
      replyTo: "r@b.test",
    });

    expect(result).toEqual({ success: true, messageId: "m-1" });
    expect(mocks.sendMail).toHaveBeenCalledWith({
      from: '"Creative Tools" <noreply@exyconn.test>',
      to: "a@b.test",
      subject: "Hi",
      text: "Body",
      html: undefined,
      replyTo: "r@b.test",
    });
    expect(mocks.createTransport).toHaveBeenCalledWith({
      host: "smtp.test",
      port: 587,
      secure: false,
      auth: { user: "mailer", pass: "pw" },
    });
  });

  it("honours an explicit sender and reuses the transport until the credentials change", async () => {
    mocks.sendMail.mockResolvedValue({ messageId: "m" });
    const { sendEmail } = await import("../services/email.js");

    await sendEmail({ to: "a@b.test", subject: "1", from: "me@x.test" });
    await sendEmail({ to: "a@b.test", subject: "2" });
    expect(mocks.createTransport).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail.mock.calls[0][0].from).toBe("me@x.test");

    mocks.emailConfig.mockResolvedValue({ ...EMAIL, password: "rotated" });
    await sendEmail({ to: "a@b.test", subject: "3" });
    expect(mocks.createTransport).toHaveBeenCalledTimes(2);
  });

  it("passes a plain From address through, including a malformed bracket", async () => {
    mocks.sendMail.mockResolvedValue({ messageId: "m" });
    const { sendEmail } = await import("../services/email.js");

    mocks.emailConfig.mockResolvedValue({
      ...EMAIL,
      fromAddress: "plain@x.test",
    });
    await sendEmail({ to: "a@b.test", subject: "1" });
    expect(mocks.sendMail.mock.calls[0][0].from).toBe(
      '"Creative Tools" <plain@x.test>',
    );

    mocks.emailConfig.mockResolvedValue({
      ...EMAIL,
      fromAddress: "Odd <> <real@x.test>",
      password: "2",
    });
    await sendEmail({ to: "a@b.test", subject: "2" });
    expect(mocks.sendMail.mock.calls[1][0].from).toBe(
      '"Creative Tools" <real@x.test>',
    );

    mocks.emailConfig.mockResolvedValue({
      ...EMAIL,
      fromAddress: "Broken <nope",
      password: "3",
    });
    await sendEmail({ to: "a@b.test", subject: "3" });
    expect(mocks.sendMail.mock.calls[2][0].from).toBe(
      '"Creative Tools" <Broken <nope>',
    );
  });

  it("reports a failed send without leaking internals in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.sendMail.mockRejectedValue(
      new Error("535 auth failed for mailer:pw"),
    );
    const { sendEmail } = await import("../services/email.js");

    await expect(sendEmail({ to: "a@b.test", subject: "x" })).resolves.toEqual({
      success: false,
      error: "Failed to send email",
    });
  });
});

describe("ImageKit service", () => {
  it("uploads with a unique file name and returns the stored file", async () => {
    mocks.upload.mockResolvedValue({
      url: "https://ik.test/tools/a.png",
      fileId: "f1",
      name: "a_x.png",
    });
    const { uploadImage } = await import("../services/imagekit.js");
    const file = Buffer.from("png");

    const result = await uploadImage(file, "a.png", "/tools");

    expect(result).toEqual({
      success: true,
      url: "https://ik.test/tools/a.png",
      fileId: "f1",
      name: "a_x.png",
    });
    expect(mocks.upload).toHaveBeenCalledWith({
      file,
      fileName: "a.png",
      folder: "/tools",
      useUniqueFileName: true,
    });
    expect(mocks.imagekit).toHaveBeenCalledWith(IMAGE);
  });

  it("builds the client once while the credentials stay the same", async () => {
    mocks.upload.mockResolvedValue({ url: "u", fileId: "f", name: "n" });
    const { uploadImage } = await import("../services/imagekit.js");

    await uploadImage(Buffer.from("a"), "a.png", "/tools");
    await uploadImage(Buffer.from("b"), "b.png", "/tools");
    expect(mocks.imagekit).toHaveBeenCalledTimes(1);

    mocks.imageConfig.mockResolvedValue({ ...IMAGE, privateKey: "rotated" });
    await uploadImage(Buffer.from("c"), "c.png", "/tools");
    expect(mocks.imagekit).toHaveBeenCalledTimes(2);
  });

  it("answers a failed upload with a fixed message", async () => {
    mocks.upload.mockRejectedValue(new Error("provider said no: key priv"));
    const { uploadImage } = await import("../services/imagekit.js");

    await expect(
      uploadImage(Buffer.from("a"), "a.png", "/tools"),
    ).resolves.toEqual({
      success: false,
      error: "Upload failed",
    });
  });

  it("deletes a file under the tools folder", async () => {
    mocks.getFileDetails.mockResolvedValue({ filePath: "/tools/a.png" });
    mocks.deleteFile.mockResolvedValue(undefined);
    const { deleteToolsImage } = await import("../services/imagekit.js");

    await expect(deleteToolsImage("f1")).resolves.toBe("deleted");
    expect(mocks.deleteFile).toHaveBeenCalledWith("f1");
  });

  it("refuses to delete a file outside the tools folder", async () => {
    mocks.getFileDetails.mockResolvedValue({ filePath: "/customers/a.png" });
    const { deleteToolsImage } = await import("../services/imagekit.js");

    await expect(deleteToolsImage("f2")).resolves.toBe("forbidden");
    expect(mocks.deleteFile).not.toHaveBeenCalled();
  });

  it("reports a failed delete", async () => {
    mocks.getFileDetails.mockRejectedValue(new Error("not found"));
    const { deleteToolsImage } = await import("../services/imagekit.js");

    await expect(deleteToolsImage("f3")).resolves.toBe("failed");
  });
});

describe("services index", () => {
  it("re-exports the email and image helpers", async () => {
    const services = await import("../services/index.js");

    expect(typeof services.sendEmail).toBe("function");
    expect(typeof services.uploadImage).toBe("function");
    expect(typeof services.deleteToolsImage).toBe("function");
    expect(services.TOOLS_FOLDER).toBe("/tools");
  });
});
