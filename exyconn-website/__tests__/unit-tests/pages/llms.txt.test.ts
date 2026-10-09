import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ publishedPaths: vi.fn(), aiServicePaths: vi.fn() }));
vi.mock("../../../src/lib/cms/paths", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../src/lib/cms/paths")>()),
  publishedPaths: mocks.publishedPaths,
}));
vi.mock("../../../src/lib/cms/ai-services", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../src/lib/cms/ai-services")>()),
  aiServicePaths: mocks.aiServicePaths,
}));

import { GET } from "../../../src/pages/llms.txt";
import { routeContext } from "./route-helpers";

const DEFAULT_HEADERS = { host: "exyconn.com" };

const llms = async (headers: Record<string, string> = DEFAULT_HEADERS) => {
  const response = await GET(
    routeContext(new Request("https://exyconn.com/llms.txt", { headers }))
  );
  return { response, text: await response.text() };
};

beforeEach(() => {
  mocks.publishedPaths.mockReset();
  mocks.aiServicePaths.mockReset();
  mocks.aiServicePaths.mockResolvedValue(["/ai-services/voice-agents"]);
});

describe("GET /llms.txt", () => {
  it("describes the company and links its main pages", async () => {
    mocks.publishedPaths.mockResolvedValue({ site: null, paths: [] });

    const { response, text } = await llms();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=86400");
    expect(text.startsWith("# Exyconn\n")).toBe(true);
    expect(text).toContain("- [Contact](https://exyconn.com/contact): Get in touch");
    expect(text).toContain("- [XML sitemap](https://exyconn.com/sitemap.xml)");
    expect(text).not.toContain("## More pages");
    expect(mocks.publishedPaths).toHaveBeenCalledWith("exyconn.com");
    expect(mocks.aiServicePaths).toHaveBeenCalledWith(undefined);
  });

  it("adds the CMS pages it does not already describe as a last section", async () => {
    mocks.publishedPaths.mockResolvedValue({
      site: { id: "site-1" },
      paths: [
        "",
        "/blog",
        "/grievance",
        "/ai-services/voice-agents",
        "/landing",
        "/newsletter/october",
      ],
    });

    const { text } = await llms({});

    expect(mocks.publishedPaths).toHaveBeenCalledWith("");
    expect(mocks.aiServicePaths).toHaveBeenCalledWith("site-1");
    expect(
      text.endsWith(
        "\n## More pages\n" +
          "- [/landing](https://exyconn.com/landing)\n" +
          "- [/newsletter/october](https://exyconn.com/newsletter/october)\n"
      )
    ).toBe(true);
  });
});
