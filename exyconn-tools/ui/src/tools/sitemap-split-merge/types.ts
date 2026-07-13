export interface SplitResult {
  sitemaps: { index: number; content: string; urlCount: number }[];
  indexFile: string;
  totalUrls: number;
}
