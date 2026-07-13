export interface UserAgentRule {
  id: string;
  userAgent: string;
  allow: string[];
  disallow: string[];
}
