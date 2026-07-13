export interface FrequencyStats {
  changefreq: Record<string, number>;
  priority: Record<string, number>;
  totalUrls: number;
  recommendations: string[];
}
