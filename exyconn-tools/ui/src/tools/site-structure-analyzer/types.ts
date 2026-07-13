export interface StructurePage {
  url: string;
  title: string;
  incomingLinks: number;
  outgoingLinks: number;
  depth: number;
}

export interface SiteStructure {
  baseUrl: string;
  totalPages: number;
  totalInternalLinks: number;
  maxDepth: number;
  pages: StructurePage[];
  orphanPages: string[];
}
