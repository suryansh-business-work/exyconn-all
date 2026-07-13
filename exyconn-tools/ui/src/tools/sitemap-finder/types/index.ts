export interface SitemapInfo {
  url: string;
  type: 'xml' | 'index' | 'txt' | 'html';
  urlCount: number;
  lastModified?: string;
  isValid: boolean;
  errorMessage?: string;
  size?: string;
}

export interface SitemapResult {
  baseUrl: string;
  sitemapsFound: SitemapInfo[];
  totalUrls: number;
  robotsTxtExists: boolean;
  robotsTxtUrl?: string;
  checkedLocations: string[];
  scanTime: number;
}

export interface SitemapFormValues {
  url: string;
  checkCommonPaths: boolean;
  parseRobotsTxt: boolean;
  maxDepth: number;
}
