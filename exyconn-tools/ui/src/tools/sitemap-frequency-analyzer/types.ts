export interface FrequencyStats {
  changefreq: Record<string, number>;
  priority: Record<string, number>;
  totalUrls: number;
  recommendations: string[];
}

/** What the frequency endpoint answers with. */
export interface FrequencyResponse {
  changefreqStats: { freq: string; count: number }[];
  priorityStats: { range: string; count: number }[];
  recommendations: string[];
  urlsWithoutChangefreq: number;
  urlsWithoutPriority: number;
}
