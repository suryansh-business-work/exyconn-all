/** The tool detail template's loader: the tool, its category and the tools beside it. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toolLoader, type ToolDetail } from "../../../../../src/lib/cms/loaders/tools";
import { getTool, getToolCategories, getTools } from "../../../../../src/lib/portal";
import { tool, toolCategory } from "../fixtures";
import { loaderInput, SITE_URL } from "./input";

vi.mock("../../../../../src/lib/portal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../src/lib/portal")>()),
  getTool: vi.fn(),
  getToolCategories: vi.fn(),
  getTools: vi.fn(),
}));

const getOne = vi.mocked(getTool);
const getCategories = vi.mocked(getToolCategories);
const getAll = vi.mocked(getTools);

beforeEach(() => {
  getOne.mockReset();
  getCategories.mockReset();
  getAll.mockReset();
});

describe("toolLoader", () => {
  it("is a 404 without a tool code or a tool", async () => {
    await expect(toolLoader(loaderInput({}))).resolves.toBeNull();
    expect(getOne).not.toHaveBeenCalled();
    getOne.mockResolvedValue(null);
    await expect(toolLoader(loaderInput({ toolCode: "gone" }))).resolves.toBeNull();
    expect(getCategories).not.toHaveBeenCalled();
  });

  it("reads the tool with its category and siblings", async () => {
    const found = tool();
    const sibling = tool({ toolCode: "yaml", name: "YAML" });
    const category = toolCategory();
    getOne.mockResolvedValue(found);
    getCategories.mockResolvedValue([toolCategory({ slug: "brand" }), category]);
    getAll.mockResolvedValue([found, sibling]);
    const load = await toolLoader(loaderInput({ toolCode: "json-formatter" }));
    expect(getOne).toHaveBeenCalledWith("json-formatter");
    expect(getAll).toHaveBeenCalledWith("developer");
    expect(load?.item).toEqual({
      tool: found,
      category,
      siblings: [found, sibling],
    } satisfies ToolDetail);
    expect(load?.vars).toEqual({ name: "JSON formatter", summary: "Pretty-print JSON" });
    expect(load?.jsonLd?.[0]).toMatchObject({ "@type": "BreadcrumbList" });
    expect(load?.jsonLd?.[0].itemListElement).toContainEqual({
      "@type": "ListItem",
      position: 2,
      name: "Section",
      item: `${SITE_URL}/section`,
    });
  });

  it("has no category when the tool's category is not published", async () => {
    getOne.mockResolvedValue(tool());
    getCategories.mockResolvedValue([]);
    getAll.mockResolvedValue([]);
    const load = await toolLoader(loaderInput({ toolCode: "json-formatter" }));
    expect(load?.item).toMatchObject({ category: null, siblings: [] });
  });
});
