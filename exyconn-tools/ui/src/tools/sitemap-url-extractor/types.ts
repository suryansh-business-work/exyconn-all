export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export interface ExtractResult {
  urls: SitemapUrl[];
  totalCount: number;
  sitemapType: 'urlset' | 'sitemapindex';
  childSitemaps?: string[];
}
