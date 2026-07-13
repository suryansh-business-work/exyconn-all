import { ToolItem, ToolCategory } from '../../shared/data/toolsData';

export type { ToolItem, ToolCategory };

export type StatusFilter = 'all' | 'available' | 'coming-soon';

export interface ToolsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  mode: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogoClick: () => void;
  onOpenSecrets: () => void;
}

export interface CategoryTabsProps {
  categories: string[];
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
  onShowDescription?: (tool: ToolItem) => void;
}

export interface HeroSectionProps {
  title: string;
  subtitle: string;
  totalTools: number;
  availableTools: number;
  comingSoonTools: number;
}

export interface StatsBarProps {
  totalTools: number;
  availableTools: number;
  comingSoonTools: number;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
}
