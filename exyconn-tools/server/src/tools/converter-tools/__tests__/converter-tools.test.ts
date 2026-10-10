import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  safeRequest: vi.fn(),
  convertToHtml: vi.fn(),
}));
vi.mock("../../../shared/security/safe-http", () => ({
  safeRequest: mocks.safeRequest,
}));
vi.mock("mammoth", () => ({ default: { convertToHtml: mocks.convertToHtml } }));

import { mountRouter } from "../../../__tests__/helpers/mountRouter";
import { pdfWithText } from "../../../__tests__/helpers/pdf";
import routes from "../routes";
import * as services from "../services";
import * as controllers from "../controllers";

const app = mountRouter(routes);

beforeEach(() => {
  mocks.safeRequest.mockReset();
  mocks.convertToHtml.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("csvToMarkdown", () => {
  it("builds a table from the header row, honouring quoted commas", () => {
    const md = services.csvToMarkdown('name,note\nAda,"a, b"\nLin');

    expect(md).toBe(
      "| name | note |\n| --- | --- |\n| Ada | a, b |\n| Lin |  |\n",
    );
  });

  it("numbers the columns when the file has no header", () => {
    expect(services.csvToMarkdown("a,b\nc,d", false)).toBe(
      "| Column 1 | Column 2 |\n| --- | --- |\n| a | b |\n| c | d |\n",
    );
  });
});

describe("jsonToMarkdown", () => {
  it("renders scalars as code, strings as text", () => {
    expect(services.jsonToMarkdown("null")).toBe("`null`\n");
    expect(services.jsonToMarkdown("true")).toBe("`true`\n");
    expect(services.jsonToMarkdown("12")).toBe("`12`\n");
    expect(services.jsonToMarkdown('"hi"', 1)).toBe("  hi\n");
  });

  it("renders objects with nested sections", () => {
    const md = services.jsonToMarkdown('{"a":1,"b":{"c":"x"},"d":null}');

    expect(md).toBe("- **a**: 1\n### b\n\n- **c**: x\n- **d**: null\n");
  });

  it("renders an array of objects as a table", () => {
    const md = services.jsonToMarkdown('[{"id":1,"name":"a"},{"id":2}]');

    expect(md).toBe("| id | name |\n| --- | --- |\n| 1 | a |\n| 2 |  |\n");
  });

  it("renders other arrays as numbered items, and an empty one by name", () => {
    expect(services.jsonToMarkdown("[1,[2]]")).toContain(
      "- **Item 1**\n  `1`\n- **Item 2**\n",
    );
    expect(services.jsonToMarkdown("[]")).toBe("*(empty array)*\n");
  });

  it("does not make a table of objects with more than ten distinct keys", () => {
    const wide = Object.fromEntries(
      Array.from({ length: 11 }, (_, i) => [`k${i}`, i]),
    );

    expect(services.jsonToMarkdown(JSON.stringify([wide]))).toContain(
      "- **Item 1**",
    );
  });

  it("rejects text that is not JSON", () => {
    expect(() => services.jsonToMarkdown("{oops")).toThrow();
  });
});

describe("htmlToMarkdown", () => {
  it("converts the body and drops scripts and styles", () => {
    const md = services.htmlToMarkdown(
      "<html><head><style>p{}</style></head><body><h1>Hi</h1><script>x()</script><p><del>old</del> new</p></body></html>",
    );

    expect(md).toBe("# Hi\n\n~~old~~ new");
  });
});

describe("htmlToMarkdown edge cases", () => {
  it("converts an empty document to nothing", () => {
    expect(services.htmlToMarkdown("")).toBe("");
    expect(services.htmlToMarkdown("<script>x()</script>")).toBe("");
  });
});

describe("rtfToMarkdown", () => {
  it("strips control words and keeps paragraphs, tabs and escaped characters", () => {
    const rtf = String.raw`{\rtf1\ansi\deff0 {\fonttbl{\f0 Arial;}}{\colortbl;\red0\green0\blue0;}
\pard Hello\par World\line there\tab x caf\'e9\par}`;

    const md = services.rtfToMarkdown(rtf);

    expect(md).toBe("Hello\n\nWorld\nthere\tx café");
  });

  it("keeps the text of a document that has no font table", () => {
    expect(services.rtfToMarkdown(String.raw`{\rtf1\ansi Hello\par}`)).toBe(
      "Hello",
    );
  });
});

describe("xmlToMarkdown", () => {
  it("writes elements, attributes and text as a nested list", () => {
    const md = services.xmlToMarkdown(
      '<root id="1"><item a="x">One</item><group><leaf>Two</leaf></group>tail</root>',
    );

    expect(md).toBe(
      '## root _(id="1")_\n\n  - **item** _(a="x")_: One\n  - **group**\n    - **leaf**: Two\ntail',
    );
  });

  it("ignores whitespace between elements and comments", () => {
    const md = services.xmlToMarkdown(
      "<root>\n  <!-- note -->\n  <a>1</a>\n</root>",
    );

    expect(md).toBe("## root\n\n  - **a**: 1");
  });

  it("keeps a root element's text on its heading line", () => {
    expect(services.xmlToMarkdown("<a>b</a>")).toBe("## a: b");
  });

  it("says so when the document is empty", () => {
    expect(services.xmlToMarkdown("")).toBe("*Empty XML document*");
  });
});

describe("textToMarkdown", () => {
  it("links URLs, marks headings and normalises list markers", () => {
    const md = services.textToMarkdown(
      "OVERVIEW\nSee https://a.test now\nTitle\n=====\nSub\n---\n1.   one\n• two\na) three",
    );

    expect(md).toContain("## OVERVIEW");
    expect(md).toContain("[https://a.test](https://a.test)");
    expect(md).toContain("# Title");
    expect(md).toContain("## Sub");
    expect(md).toContain("1. one");
    expect(md).toContain("- two");
    expect(md).toContain("- three");
  });

  it("fences indented lines as code, closing a block left open at the end", () => {
    const md = services.textToMarkdown(
      "text\n    code one\n    code two\nafter\n\tlast",
    );

    expect(md).toBe(
      "text\n```\ncode one\ncode two\n```\nafter\n```\nlast\n```",
    );
  });

  it("leaves text alone when every detector is off", () => {
    const text = "SHOUT https://a.test\n    x";

    expect(
      services.textToMarkdown(text, {
        detectHeadings: false,
        detectLists: false,
        detectLinks: false,
        detectCodeBlocks: false,
      }),
    ).toBe(text);
  });
});

describe("pdfToMarkdown", () => {
  it("adds the title and author above the text", async () => {
    const md = await services.pdfToMarkdown(
      pdfWithText("Body text here", { title: "Annual Plan", author: "Ada" }),
    );

    expect(md).toBe("# Annual Plan\n\n**Author:** Ada\n\nBody text here");
  });

  it("converts a PDF with no title or author to just its text", async () => {
    await expect(
      services.pdfToMarkdown(pdfWithText("Only text")),
    ).resolves.toBe("Only text");
  });
});

describe("docxToMarkdown", () => {
  it("converts through HTML", async () => {
    mocks.convertToHtml.mockResolvedValue({
      value: "<h2>Heading</h2><p>Text</p>",
    });

    await expect(services.docxToMarkdown(Buffer.from("d"))).resolves.toBe(
      "## Heading\n\nText",
    );
  });
});

describe("URL conversions", () => {
  it("converts a webpage's main content and titles it", async () => {
    mocks.safeRequest.mockResolvedValue({
      data: "<html><head><title> My Page </title></head><body><nav>x</nav><main><p>Body</p></main></body></html>",
    });

    await expect(services.webpageToMarkdown("https://a.test")).resolves.toEqual(
      {
        markdown: "# My Page\n\nBody",
        title: "My Page",
      },
    );
  });

  it("titles a webpage from its first heading, then as Untitled, and falls back through content areas", async () => {
    mocks.safeRequest.mockResolvedValueOnce({
      data: "<html><body><h1>Head</h1><article>Art</article></body></html>",
    });
    await expect(
      services.webpageToMarkdown("https://a.test"),
    ).resolves.toMatchObject({
      title: "Head",
      markdown: "# Head\n\nArt",
    });

    mocks.safeRequest.mockResolvedValueOnce({
      data: '<html><body><div role="main">Role</div></body></html>',
    });
    await expect(services.webpageToMarkdown("https://a.test")).resolves.toEqual(
      {
        title: "Untitled",
        markdown: "# Untitled\n\nRole",
      },
    );

    mocks.safeRequest.mockResolvedValueOnce({
      data: "<html><body>Plain body</body></html>",
    });
    await expect(
      services.webpageToMarkdown("https://a.test"),
    ).resolves.toMatchObject({
      markdown: "# Untitled\n\nPlain body",
    });

    mocks.safeRequest.mockResolvedValueOnce({ data: "" });
    await expect(
      services.webpageToMarkdown("https://a.test"),
    ).resolves.toMatchObject({
      markdown: "# Untitled\n\n",
    });
  });

  it("converts a Notion page, dropping the site suffix from its title", async () => {
    mocks.safeRequest.mockResolvedValue({
      data: '<html><head><title>Roadmap | Notion</title></head><body><div class="notion-page-content"><p>Plan</p></div></body></html>',
    });

    await expect(
      services.notionToMarkdown("https://notion.so/x"),
    ).resolves.toEqual({
      markdown: "# Roadmap\n\nPlan",
      title: "Roadmap",
    });
  });

  it("finds a Notion page's content in the article, main or body, and titles it from its heading", async () => {
    const html = (inner: string) => ({
      data: `<html><body>${inner}</body></html>`,
    });
    mocks.safeRequest
      .mockResolvedValueOnce(html("<h1>H</h1><article>A</article>"))
      .mockResolvedValueOnce(html("<main>M</main>"))
      .mockResolvedValueOnce(html("B"))
      .mockResolvedValueOnce({ data: "" });

    await expect(
      services.notionToMarkdown("https://n.test"),
    ).resolves.toMatchObject({ title: "H", markdown: "# H\n\nA" });
    await expect(
      services.notionToMarkdown("https://n.test"),
    ).resolves.toMatchObject({ markdown: "# Untitled\n\nM" });
    await expect(
      services.notionToMarkdown("https://n.test"),
    ).resolves.toMatchObject({ markdown: "# Untitled\n\nB" });
    await expect(
      services.notionToMarkdown("https://n.test"),
    ).resolves.toMatchObject({ markdown: "# Untitled\n\n" });
  });

  it("converts a shared Google Doc through its HTML export", async () => {
    mocks.safeRequest.mockResolvedValue({
      data: "<html><head><title>Spec</title><style>p{}</style></head><body><p>Doc text</p></body></html>",
    });

    await expect(
      services.googleDocsToMarkdown(
        "https://docs.google.com/document/d/abc-123_X/edit",
      ),
    ).resolves.toEqual({ markdown: "# Spec\n\nDoc text", title: "Spec" });
    expect(mocks.safeRequest.mock.calls[0][0]).toBe(
      "https://docs.google.com/document/d/abc-123_X/export?format=html",
    );
  });

  it("names an untitled Google Doc, and an empty one has no body", async () => {
    mocks.safeRequest.mockResolvedValue({ data: "" });

    await expect(
      services.googleDocsToMarkdown(
        "https://docs.google.com/document/d/abc/edit",
      ),
    ).resolves.toEqual({ markdown: "# Google Doc\n\n", title: "Google Doc" });
  });

  it("refuses a link that is not a Google Docs document", async () => {
    await expect(
      services.googleDocsToMarkdown("https://example.test/file"),
    ).rejects.toThrow("Invalid Google Docs URL");
  });
});

describe("routes", () => {
  const post = (path: string, body: object) =>
    request(app).post(path).send(body);

  it.each([
    ["/csv-to-markdown", { content: "a,b\n1,2" }, "| a | b |"],
    ["/json-to-markdown", { content: '{"a":1}' }, "- **a**: 1"],
    ["/html-to-markdown", { content: "<p>Hi</p>" }, "Hi"],
    ["/rtf-to-markdown", { content: String.raw`{\rtf1 Hi\par}` }, "Hi"],
    ["/xml-to-markdown", { content: "<a>b</a>" }, "## a: b"],
    [
      "/text-to-markdown",
      { content: "plain", options: { detectLinks: false } },
      "plain",
    ],
  ])("POST %s answers with the markdown", async (path, body, expected) => {
    const res = await post(path, body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.markdown).toContain(expected);
  });

  it("validates the content field", async () => {
    const res = await post("/csv-to-markdown", { content: "" });

    expect(res.status).toBe(400);
  });

  it("answers 500 with the parser's message for bad JSON", async () => {
    const res = await post("/json-to-markdown", { content: "{oops" });

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ success: false });
    expect(typeof res.body.error).toBe("string");
  });

  it.each([
    [
      "/webpage-to-markdown",
      "<html><head><title>T</title></head><body><main>x</main></body></html>",
    ],
    [
      "/notion-to-markdown",
      "<html><head><title>T | Notion</title></head><body>x</body></html>",
    ],
  ])("POST %s returns markdown and title", async (path, html) => {
    mocks.safeRequest.mockResolvedValue({ data: html });

    const res = await post(path, { url: "https://a.test/page" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: "T" });
  });

  it("POST /google-docs-to-markdown returns markdown and title", async () => {
    mocks.safeRequest.mockResolvedValue({
      data: "<html><head><title>D</title></head><body>x</body></html>",
    });

    const res = await post("/google-docs-to-markdown", {
      url: "https://docs.google.com/document/d/abc/edit",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("D");
  });

  it.each([
    "/webpage-to-markdown",
    "/notion-to-markdown",
    "/google-docs-to-markdown",
  ])("POST %s answers 500 when the page cannot be fetched", async (path) => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.safeRequest.mockRejectedValue(new Error("internal detail"));

    const res = await post(path, {
      url: "https://docs.google.com/document/d/abc/edit",
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: "Conversion failed" });
    vi.unstubAllEnvs();
  });

  it("POST /pdf-to-markdown converts an uploaded PDF", async () => {
    const res = await request(app)
      .post("/pdf-to-markdown")
      .attach("file", pdfWithText("Uploaded PDF"), "a.pdf");

    expect(res.status).toBe(200);
    expect(res.body.data.markdown).toBe("Uploaded PDF");
  });

  it("POST /docx-to-markdown converts an uploaded document", async () => {
    mocks.convertToHtml.mockResolvedValue({ value: "<p>From docx</p>" });

    const res = await request(app)
      .post("/docx-to-markdown")
      .attach("file", Buffer.from("docx"), "a.docx");

    expect(res.status).toBe(200);
    expect(res.body.data.markdown).toBe("From docx");
  });

  it.each(["/pdf-to-markdown", "/docx-to-markdown"])(
    "POST %s needs a file",
    async (path) => {
      const res = await request(app).post(path).send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ success: false, error: "No file uploaded" });
    },
  );

  it("answers 500 when the uploaded file cannot be converted", async () => {
    const pdf = await request(app)
      .post("/pdf-to-markdown")
      .attach("file", Buffer.from("not a pdf"), "a.pdf");
    expect(pdf.status).toBe(500);

    mocks.convertToHtml.mockRejectedValue(new Error("corrupt"));
    const docx = await request(app)
      .post("/docx-to-markdown")
      .attach("file", Buffer.from("x"), "a.docx");
    expect(docx.status).toBe(500);
    expect(docx.body.success).toBe(false);
  });
});

describe("controllers called directly", () => {
  it.each([
    "convertCsvToMarkdown",
    "convertJsonToMarkdown",
    "convertRtfToMarkdown",
    "convertTextToMarkdown",
    "convertWebpageToMarkdown",
    "convertNotionToMarkdown",
    "convertGoogleDocsToMarkdown",
  ] as const)("%s answers 500 when the body has no content", async (name) => {
    mocks.safeRequest.mockRejectedValue(new Error("no url"));
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await controllers[name]({ body: {} } as never, res as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: expect.any(String),
    });
  });

  it("html and xml conversion answer 500 when the parser itself throws", async () => {
    const hostile = new Proxy(
      {},
      {
        get: () => {
          throw new Error("boom");
        },
      },
    );
    for (const handler of [
      controllers.convertHtmlToMarkdown,
      controllers.convertXmlToMarkdown,
    ]) {
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      await handler({ body: hostile } as never, res as never);
      expect(res.status).toHaveBeenCalledWith(500);
    }
  });
});
