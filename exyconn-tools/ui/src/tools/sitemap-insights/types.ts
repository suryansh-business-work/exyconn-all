export interface InsightsResult {
  totalUrls: number;
  urlPatterns: { pattern: string; count: number; percentage: number }[];
  depthAnalysis: { depth: number; count: number }[];
  domainBreakdown: { domain: string; count: number }[];
  fileTypes: { extension: string; count: number }[];
  lastmodFreshness: { category: string; count: number }[];
  changefreqDistribution: { freq: string; count: number }[];
  priorityDistribution: { range: string; count: number }[];
}
