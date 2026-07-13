export interface PageInfo {
  url: string;
  title: string;
  description: string;
  depth: number;
  statusCode?: number;
  wordCount: number;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  images: number;
  links: number;
}

export interface ScanResult {
  totalPages: number;
  pages: PageInfo[];
}
