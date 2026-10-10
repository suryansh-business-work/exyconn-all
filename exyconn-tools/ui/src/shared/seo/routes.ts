/** Every indexable URL of the tools site, with its meta, and the meta of any pathname. */
import type { PageMeta } from '@exyconn/seo';
import { toolsData, findCategoryBySlug, findToolById, getCategoryOfTool } from '../data/toolsData';
import { categoryMeta, hubMeta, notFoundMeta, toolMeta } from './pages';
import { HUB_PATH, categoryPath } from './site';

export interface SeoRoute {
  readonly path: string;
  readonly meta: PageMeta;
}

/** Canonical routes in sitemap order: hub, categories, then each category's tools. */
export function seoRoutes(): SeoRoute[] {
  return [
    { path: HUB_PATH, meta: hubMeta() },
    ...toolsData.map((category) => ({ path: categoryPath(category.slug), meta: categoryMeta(category) })),
    ...toolsData.flatMap((category) =>
      category.items.map((tool) => ({ path: tool.url, meta: toolMeta(tool, category) }))
    ),
  ];
}

const CATEGORY_PREFIX = '/categories/';
const TOOL_PREFIX = '/tools/';

/** `value` without its trailing slashes (a loop: `/\/+$/` is quadratic on a long run of them). */
function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') {
    end -= 1;
  }
  return value.slice(0, end);
}

/** The meta for whatever route `pathname` renders (the 404 page's for unknown paths). */
export function metaForPath(pathname: string): PageMeta {
  const path = trimTrailingSlashes(pathname) || '/';
  if (path === '/' || path === HUB_PATH) {
    return hubMeta();
  }
  if (path.startsWith(CATEGORY_PREFIX)) {
    const category = findCategoryBySlug(path.slice(CATEGORY_PREFIX.length));
    if (category) {
      return categoryMeta(category);
    }
  }
  if (path.startsWith(TOOL_PREFIX)) {
    const id = path.slice(TOOL_PREFIX.length);
    const tool = findToolById(id);
    const category = getCategoryOfTool(id);
    if (tool && category) {
      return toolMeta(tool, category);
    }
  }
  return notFoundMeta(path);
}
