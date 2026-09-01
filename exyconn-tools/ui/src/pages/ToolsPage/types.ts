import { ToolItem, ToolCategory } from '../../shared/data/toolsData';

export type { ToolItem, ToolCategory };

export interface ToolsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  mode: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogoClick: () => void;
  onOpenSecrets: () => void;
}

export interface CategorySelectProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export interface ToolCardProps {
  tool: ToolItem;
  onToolClick: (tool: ToolItem) => void;
}

export interface ToolsGridProps {
  category: ToolCategory;
  onToolClick: (tool: ToolItem) => void;
}

export interface HeroSectionProps {
  title: string;
  subtitle: string;
  totalTools: number;
  categoryCount: number;
}
