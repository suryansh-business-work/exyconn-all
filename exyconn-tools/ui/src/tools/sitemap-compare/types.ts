export interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

export interface ModifiedUrl {
  url: string;
  oldLastmod?: string;
  newLastmod?: string;
}

export interface CompareResult {
  added: SitemapUrl[];
  removed: SitemapUrl[];
  modified: ModifiedUrl[];
  unchanged: number;
  summary: {
    sitemap1Count: number;
    sitemap2Count: number;
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
  };
}
