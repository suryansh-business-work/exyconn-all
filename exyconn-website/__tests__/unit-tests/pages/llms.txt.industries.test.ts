/** /llms.txt's industry lines read the Industries menu: label, link and its one-line summary. */
import { expect, it, vi } from "vitest";

vi.mock("../../../src/lib/cms/paths", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../src/lib/cms/paths")>()),
  publishedPaths: vi.fn().mockResolvedValue({ site: null, paths: [] }),
}));
vi.mock("../../../src/lib/cms/ai-services", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../src/lib/cms/ai-services")>()),
  aiServicePaths: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../../src/lib/chrome/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../src/lib/chrome/navigation")>();
  return {
    ...actual,
    INDUSTRIES: {
      ...actual.INDUSTRIES,
      links: [
        { label: "Retail", href: "/industries/retail", text: "Store Ops and Returns" },
        { label: "Travel", href: "/industries/travel" },
      ],
    },
  };
});

import { GET } from "../../../src/pages/llms.txt";
import { routeContext } from "./route-helpers";

it("lists each industry with its lower-cased summary, and no summary when the menu has none", async () => {
  const response = await GET(
    routeContext(new Request("https://exyconn.com/llms.txt", { headers: { host: "exyconn.com" } }))
  );
  const text = await response.text();
  expect(text).toContain(
    "- [Retail](https://exyconn.com/industries/retail): AI agents and automation for retail — store ops and returns"
  );
  expect(text).toContain(
    "- [Travel](https://exyconn.com/industries/travel): AI agents and automation for travel — \n"
  );
});
