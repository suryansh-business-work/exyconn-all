import type { ToolCategory } from '../../shared/data/toolsData';

/** Categories narrowed to the tools whose name or description matches `query`. */
export function filterCategories(categories: readonly ToolCategory[], query: string): ToolCategory[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...categories];
  }
  return categories
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (tool) => tool.name.toLowerCase().includes(needle) || tool.description.toLowerCase().includes(needle)
      ),
    }))
    .filter((category) => category.items.length > 0);
}
