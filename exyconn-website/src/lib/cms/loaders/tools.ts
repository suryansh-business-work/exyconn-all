import { breadcrumbJsonLd } from "../../inner/structured-data";
import { getTool, getToolCategories, getTools } from "../../portal";
import type { Tool, ToolCategory } from "../../portal/types";
import { itemCrumbs } from "./crumbs";
import type { PageLoader } from "./types";

/** cms.detail of 'tools.detail': the tool, its category and every tool of that category. */
export interface ToolDetail {
  tool: Tool;
  category: ToolCategory | null;
  siblings: Tool[];
}

export const toolLoader: PageLoader = async ({ params, siteUrl, props }) => {
  const tool = params.toolCode ? await getTool(params.toolCode) : null;
  if (!tool) {
    return null;
  }
  const [categories, siblings] = await Promise.all([
    getToolCategories(),
    getTools(tool.categorySlug),
  ]);
  const detail: ToolDetail = {
    tool,
    category: categories.find((one) => one.slug === tool.categorySlug) ?? null,
    siblings,
  };
  return {
    item: detail,
    vars: { name: tool.name, summary: tool.description },
    jsonLd: [breadcrumbJsonLd(itemCrumbs(props, tool.name), siteUrl)],
  };
};
