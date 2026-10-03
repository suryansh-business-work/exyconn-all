import type { ToolCategory } from '../../shared/data/toolsData';

export interface HubSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** Number of tools, for the placeholder. */
  total: number;
}

export interface CategorySectionProps {
  category: ToolCategory;
  /** 1-based position, printed as the section's mono index. */
  index: number;
  /** Show at most this many tools (the hub previews; the category page lists all). */
  limit?: number;
}
