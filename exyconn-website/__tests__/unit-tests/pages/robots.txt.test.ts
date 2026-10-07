import { describe, expect, it } from "vitest";
import { GET } from "../../../src/pages/robots.txt";
import { routeContext } from "./route-helpers";

const robots = async () => {
  const response = await GET(routeContext(new Request("https://exyconn.com/robots.txt")));
  return { response, text: await response.text() };
};

describe("GET /robots.txt", () => {
  it("is plain text that crawlers may cache for a day", async () => {
    const { response } = await robots();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=86400");
  });

  it("opens the site to every crawler except the API", async () => {
    const { text } = await robots();
    expect(text).toContain("User-agent: *\nAllow: /\nDisallow: /api/");
  });

  it("welcomes the AI crawlers by name, on the same terms", async () => {
    const { text } = await robots();
    for (const agent of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"]) {
      expect(text).toContain(`User-agent: ${agent}\nAllow: /\nDisallow: /api/`);
    }
  });

  it("points at the sitemap and the LLM overview", async () => {
    const { text } = await robots();
    expect(text).toContain("Sitemap: https://exyconn.com/sitemap.xml");
    expect(text).toContain("# https://exyconn.com/llms.txt");
  });
});
