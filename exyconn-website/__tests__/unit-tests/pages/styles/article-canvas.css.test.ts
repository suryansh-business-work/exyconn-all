import { describe, expect, it } from "vitest";
import canvasCss from "../../../../src/styles/article-canvas.css?inline";
import { GET } from "../../../../src/pages/styles/article-canvas.css";
import { routeContext } from "../route-helpers";

describe("GET /styles/article-canvas.css", () => {
  it("serves the article stylesheet the detail pages are built from, cached briefly", async () => {
    const response = await GET(
      routeContext(new Request("https://exyconn.com/styles/article-canvas.css"))
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/css; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
    expect(await response.text()).toBe(canvasCss);
  });
});
