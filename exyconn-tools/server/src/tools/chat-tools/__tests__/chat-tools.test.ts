import { AxiosError } from "axios";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  safeRequest: vi.fn(),
  extractRawText: vi.fn(),
}));
vi.mock("../../../shared/security/safe-http", () => ({
  safeRequest: mocks.safeRequest,
}));
vi.mock("mammoth", () => ({
  default: { extractRawText: mocks.extractRawText },
  extractRawText: mocks.extractRawText,
}));

import { mountRouter } from "../../../__tests__/helpers/mountRouter";
import { pdfWithText } from "../../../__tests__/helpers/pdf";
import routes from "../routes";
import { extractTextFromBase64, scrapeWebsite } from "../services";

const app = mountRouter(routes);

beforeEach(() => {
  mocks.safeRequest.mockReset();
  mocks.extractRawText.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const page = (html: string) => ({ data: `<html><body>${html}</body></html>` });

describe("scrapeWebsite", () => {
  it("prefers the main content area and drops navigation and scripts", async () => {
    mocks.safeRequest.mockResolvedValue(
      page(
        "<nav>Menu</nav><script>x()</script><main><h1>Title</h1>  Some   text</main><footer>Foot</footer>",
      ),
    );

    await expect(scrapeWebsite("https://site.test")).resolves.toBe(
      "Title Some text",
    );
    expect(mocks.safeRequest).toHaveBeenCalledWith(
      "https://site.test",
      expect.objectContaining({ timeout: 15000 }),
    );
  });

  it("falls back to the whole body when there is no content area", async () => {
    mocks.safeRequest.mockResolvedValue(page("<p>Just a paragraph</p>"));

    await expect(scrapeWebsite("https://site.test")).resolves.toBe(
      "Just a paragraph",
    );
  });

  it("limits very long pages to 15000 characters", async () => {
    mocks.safeRequest.mockResolvedValue(
      page(`<article>${"a".repeat(20000)}</article>`),
    );

    const content = await scrapeWebsite("https://site.test");

    expect(content).toHaveLength(15003);
    expect(content.endsWith("...")).toBe(true);
  });

  it("turns a fetch failure into a message the visitor can read", async () => {
    mocks.safeRequest.mockRejectedValue(
      new AxiosError("timeout of 15000ms exceeded"),
    );

    await expect(scrapeWebsite("https://site.test")).rejects.toMatchObject({
      name: "PublicError",
      message: "Failed to fetch website: timeout of 15000ms exceeded",
    });
  });

  it("lets other errors through untouched", async () => {
    mocks.safeRequest.mockRejectedValue(new TypeError("bad"));

    await expect(scrapeWebsite("https://site.test")).rejects.toThrow(TypeError);
  });
});

describe("extractTextFromBase64", () => {
  it("reads the text of a PDF without page footers", async () => {
    const data = pdfWithText("Quarterly report").toString("base64");

    await expect(extractTextFromBase64(data, "application/pdf")).resolves.toBe(
      "Quarterly report",
    );
  });

  it("reads Word documents through mammoth", async () => {
    mocks.extractRawText.mockResolvedValue({ value: "  Contract text \n" });
    const data = Buffer.from("docx").toString("base64");

    await expect(
      extractTextFromBase64(
        data,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).resolves.toBe("Contract text");
    await expect(
      extractTextFromBase64(data, "application/msword"),
    ).resolves.toBe("Contract text");
    expect(mocks.extractRawText.mock.calls[0][0].buffer).toEqual(
      Buffer.from("docx"),
    );
  });

  it("decodes plain text as UTF-8", async () => {
    const data = Buffer.from("héllo", "utf-8").toString("base64");

    await expect(extractTextFromBase64(data, "text/plain")).resolves.toBe(
      "héllo",
    );
  });

  it("refuses other types", async () => {
    await expect(extractTextFromBase64("AA==", "image/png")).rejects.toThrow(
      "Unsupported file type: image/png",
    );
  });
});

describe("POST /scrape-website", () => {
  it("returns the scraped content with the url", async () => {
    mocks.safeRequest.mockResolvedValue(page("<main>Hello</main>"));

    const res = await request(app)
      .post("/scrape-website")
      .send({ url: "https://site.test/a" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      content: "Hello",
      url: "https://site.test/a",
    });
  });

  it("rejects a url that is not http or https", async () => {
    const res = await request(app)
      .post("/scrape-website")
      .send({ url: "ftp://site.test" });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toBe(
      "Valid URL with http/https is required",
    );
    expect(mocks.safeRequest).not.toHaveBeenCalled();
  });

  it("answers 500 with the readable message when the fetch fails", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.safeRequest.mockRejectedValue(new AxiosError("socket hang up"));

    const res = await request(app)
      .post("/scrape-website")
      .send({ url: "https://site.test" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch website: socket hang up");
  });
});

describe("POST /extract-document", () => {
  it("returns the text and echoes the file name", async () => {
    const res = await request(app)
      .post("/extract-document")
      .send({
        fileData: Buffer.from("notes").toString("base64"),
        mimeType: "text/plain",
        fileName: "notes.txt",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      text: "notes",
      fileName: "notes.txt",
    });
  });

  it("requires both the data and the mime type", async () => {
    const res = await request(app)
      .post("/extract-document")
      .send({ fileData: "AA==" });

    expect(res.status).toBe(400);
  });

  it("answers 500 with the reason for an unsupported type", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await request(app)
      .post("/extract-document")
      .send({ fileData: "AA==", mimeType: "image/png" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Unsupported file type: image/png");
  });
});

describe("controller guards", () => {
  it("answer 400 when called without the required body fields", async () => {
    const { scrapeWebsiteController, extractDocumentTextController } =
      await import("../controllers.js");
    const res = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

    const noUrl = res();
    await scrapeWebsiteController({ body: {} } as never, noUrl as never);
    const noFile = res();
    await extractDocumentTextController(
      { body: { fileData: "AA==" } } as never,
      noFile as never,
    );

    expect(noUrl.status).toHaveBeenCalledWith(400);
    expect(noUrl.json).toHaveBeenCalledWith({ error: "URL is required" });
    expect(noFile.status).toHaveBeenCalledWith(400);
    expect(noFile.json).toHaveBeenCalledWith({
      error: "File data and mime type are required",
    });
  });
});
