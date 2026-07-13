import axios from "axios";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 SitemapTools/1.0";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
});

// ==================== SHARED TYPES ====================

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export interface ValidationIssue {
  type: "error" | "warning";
  message: string;
  url?: string;
  line?: number;
}

// ==================== XML SITEMAP VALIDATOR ====================

export interface ValidationResult {
  isValid: boolean;
  urlCount: number;
  issues: ValidationIssue[];
  urls: SitemapUrl[];
  fileSize: number;
  encoding?: string;
}

const VALID_CHANGEFREQ = [
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
];

export const validateSitemap = async (
  sitemapUrl: string,
): Promise<ValidationResult> => {
  const issues: ValidationIssue[] = [];
  const urls: SitemapUrl[] = [];

  try {
    const response = await axios.get(sitemapUrl, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024, // 50MB limit
    });

    const content = response.data;
    const fileSize = Buffer.byteLength(
      typeof content === "string" ? content : JSON.stringify(content),
    );

    // Check file size (50MB uncompressed limit per Google)
    if (fileSize > 50 * 1024 * 1024) {
      issues.push({ type: "error", message: "Sitemap exceeds 50MB limit" });
    }

    // Parse XML
    let parsed;
    try {
      parsed = xmlParser.parse(content);
    } catch {
      issues.push({ type: "error", message: "Invalid XML syntax" });
      return { isValid: false, urlCount: 0, issues, urls: [], fileSize };
    }

    // Check for urlset
    if (!parsed.urlset) {
      if (parsed.sitemapindex) {
        issues.push({
          type: "warning",
          message: "This is a sitemap index, not a sitemap",
        });
      } else {
        issues.push({
          type: "error",
          message: "Missing <urlset> root element",
        });
      }
      return {
        isValid: issues.filter((i) => i.type === "error").length === 0,
        urlCount: 0,
        issues,
        urls: [],
        fileSize,
      };
    }

    // Extract URLs
    const urlEntries = Array.isArray(parsed.urlset.url)
      ? parsed.urlset.url
      : parsed.urlset.url
        ? [parsed.urlset.url]
        : [];

    // Check URL count (50,000 limit)
    if (urlEntries.length > 50000) {
      issues.push({
        type: "error",
        message: `Sitemap has ${urlEntries.length} URLs, exceeds 50,000 limit`,
      });
    }

    urlEntries.forEach((entry: Record<string, unknown>, index: number) => {
      const url: SitemapUrl = { loc: "" };

      // Check loc (required)
      if (!entry.loc) {
        issues.push({
          type: "error",
          message: `URL #${index + 1}: Missing required <loc> tag`,
        });
      } else {
        url.loc = String(entry.loc);
        try {
          new URL(url.loc);
        } catch {
          issues.push({
            type: "error",
            message: `Invalid URL format`,
            url: url.loc,
          });
        }
      }

      // Check lastmod format
      if (entry.lastmod) {
        url.lastmod = String(entry.lastmod);
        const dateRegex =
          /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)?)?$/;
        if (!dateRegex.test(url.lastmod)) {
          issues.push({
            type: "warning",
            message: `Invalid lastmod format (should be W3C date)`,
            url: url.loc,
          });
        }
      }

      // Check changefreq
      if (entry.changefreq) {
        url.changefreq = String(entry.changefreq).toLowerCase();
        if (!VALID_CHANGEFREQ.includes(url.changefreq)) {
          issues.push({
            type: "warning",
            message: `Invalid changefreq value: ${entry.changefreq}`,
            url: url.loc,
          });
        }
      }

      // Check priority
      if (entry.priority !== undefined) {
        const priority = parseFloat(String(entry.priority));
        if (isNaN(priority) || priority < 0 || priority > 1) {
          issues.push({
            type: "warning",
            message: `Invalid priority (must be 0.0-1.0): ${entry.priority}`,
            url: url.loc,
          });
        } else {
          url.priority = priority;
        }
      }

      urls.push(url);
    });

    const errorCount = issues.filter((i) => i.type === "error").length;
    return {
      isValid: errorCount === 0,
      urlCount: urls.length,
      issues,
      urls,
      fileSize,
    };
  } catch (error) {
    issues.push({
      type: "error",
      message:
        error instanceof Error ? error.message : "Failed to fetch sitemap",
    });
    return { isValid: false, urlCount: 0, issues, urls: [], fileSize: 0 };
  }
};

// ==================== SITEMAP URL EXTRACTOR ====================

export interface ExtractedUrls {
  urls: SitemapUrl[];
  totalCount: number;
  sitemapType: "urlset" | "sitemapindex";
  childSitemaps?: string[];
}

export const extractSitemapUrls = async (
  sitemapUrl: string,
  followIndex: boolean = true,
): Promise<ExtractedUrls> => {
  const response = await axios.get(sitemapUrl, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 30000,
  });

  const parsed = xmlParser.parse(response.data);
  const urls: SitemapUrl[] = [];
  let childSitemaps: string[] = [];

  if (parsed.sitemapindex) {
    // Sitemap index
    const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
      ? parsed.sitemapindex.sitemap
      : [parsed.sitemapindex.sitemap];

    childSitemaps = sitemaps
      .map((s: Record<string, unknown>) => String(s.loc))
      .filter(Boolean);

    if (followIndex) {
      // Fetch all child sitemaps
      for (const childUrl of childSitemaps.slice(0, 10)) {
        // Limit to 10
        try {
          const childResult = await extractSitemapUrls(childUrl, false);
          urls.push(...childResult.urls);
        } catch {
          // Skip failed child sitemaps
        }
      }
    }

    return {
      urls,
      totalCount: urls.length,
      sitemapType: "sitemapindex",
      childSitemaps,
    };
  } else if (parsed.urlset) {
    const urlEntries = Array.isArray(parsed.urlset.url)
      ? parsed.urlset.url
      : parsed.urlset.url
        ? [parsed.urlset.url]
        : [];

    urlEntries.forEach((entry: Record<string, unknown>) => {
      urls.push({
        loc: String(entry.loc || ""),
        lastmod: entry.lastmod ? String(entry.lastmod) : undefined,
        changefreq: entry.changefreq ? String(entry.changefreq) : undefined,
        priority:
          entry.priority !== undefined
            ? parseFloat(String(entry.priority))
            : undefined,
      });
    });

    return { urls, totalCount: urls.length, sitemapType: "urlset" };
  }

  throw new Error("Invalid sitemap format");
};

// ==================== SITEMAP COMPARE ====================

export interface CompareResult {
  added: SitemapUrl[];
  removed: SitemapUrl[];
  modified: { url: string; oldLastmod?: string; newLastmod?: string }[];
  unchanged: number;
  summary: {
    sitemap1Count: number;
    sitemap2Count: number;
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
  };
}

export const compareSitemaps = async (
  sitemap1Url: string,
  sitemap2Url: string,
): Promise<CompareResult> => {
  const [result1, result2] = await Promise.all([
    extractSitemapUrls(sitemap1Url, true),
    extractSitemapUrls(sitemap2Url, true),
  ]);

  const urls1Map = new Map(result1.urls.map((u) => [u.loc, u]));
  const urls2Map = new Map(result2.urls.map((u) => [u.loc, u]));

  const added: SitemapUrl[] = [];
  const removed: SitemapUrl[] = [];
  const modified: { url: string; oldLastmod?: string; newLastmod?: string }[] =
    [];
  let unchanged = 0;

  // Find added and modified
  result2.urls.forEach((url2) => {
    const url1 = urls1Map.get(url2.loc);
    if (!url1) {
      added.push(url2);
    } else if (url1.lastmod !== url2.lastmod) {
      modified.push({
        url: url2.loc,
        oldLastmod: url1.lastmod,
        newLastmod: url2.lastmod,
      });
    } else {
      unchanged++;
    }
  });

  // Find removed
  result1.urls.forEach((url1) => {
    if (!urls2Map.has(url1.loc)) {
      removed.push(url1);
    }
  });

  return {
    added,
    removed,
    modified,
    unchanged,
    summary: {
      sitemap1Count: result1.totalCount,
      sitemap2Count: result2.totalCount,
      addedCount: added.length,
      removedCount: removed.length,
      modifiedCount: modified.length,
    },
  };
};

// ==================== SITEMAP INSIGHTS ====================

export interface SitemapInsights {
  totalUrls: number;
  urlPatterns: { pattern: string; count: number; percentage: number }[];
  depthAnalysis: { depth: number; count: number }[];
  domainBreakdown: { domain: string; count: number }[];
  fileTypes: { extension: string; count: number }[];
  lastmodFreshness: { category: string; count: number }[];
  changefreqDistribution: { freq: string; count: number }[];
  priorityDistribution: { range: string; count: number }[];
}

export const analyzeSitemapInsights = async (
  sitemapUrl: string,
): Promise<SitemapInsights> => {
  const result = await extractSitemapUrls(sitemapUrl, true);
  const urls = result.urls;

  // URL patterns (first path segment)
  const patternMap = new Map<string, number>();
  const depthMap = new Map<number, number>();
  const domainMap = new Map<string, number>();
  const fileTypeMap = new Map<string, number>();
  const changefreqMap = new Map<string, number>();
  const priorityMap = new Map<string, number>();
  const freshnessMap = new Map<string, number>();

  const now = new Date();

  urls.forEach((u) => {
    try {
      const urlObj = new URL(u.loc);

      // Domain
      domainMap.set(urlObj.hostname, (domainMap.get(urlObj.hostname) || 0) + 1);

      // Path depth
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      const depth = pathParts.length;
      depthMap.set(depth, (depthMap.get(depth) || 0) + 1);

      // Pattern (first segment)
      const pattern = pathParts[0] || "[root]";
      patternMap.set(pattern, (patternMap.get(pattern) || 0) + 1);

      // File extension
      const lastPart = pathParts[pathParts.length - 1] || "";
      const extMatch = lastPart.match(/\.([a-z0-9]+)$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : "none";
      fileTypeMap.set(ext, (fileTypeMap.get(ext) || 0) + 1);
    } catch {
      // Skip invalid URLs
    }

    // Changefreq
    if (u.changefreq) {
      changefreqMap.set(
        u.changefreq,
        (changefreqMap.get(u.changefreq) || 0) + 1,
      );
    }

    // Priority ranges
    if (u.priority !== undefined) {
      const range =
        u.priority >= 0.8
          ? "High (0.8-1.0)"
          : u.priority >= 0.5
            ? "Medium (0.5-0.7)"
            : "Low (0.0-0.4)";
      priorityMap.set(range, (priorityMap.get(range) || 0) + 1);
    }

    // Lastmod freshness
    if (u.lastmod) {
      const date = new Date(u.lastmod);
      const daysDiff = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
      );
      let category = "Older than 1 year";
      if (daysDiff <= 7) category = "Last 7 days";
      else if (daysDiff <= 30) category = "Last 30 days";
      else if (daysDiff <= 90) category = "Last 90 days";
      else if (daysDiff <= 365) category = "Last year";
      freshnessMap.set(category, (freshnessMap.get(category) || 0) + 1);
    }
  });

  const sortByCount = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);

  return {
    totalUrls: urls.length,
    urlPatterns: sortByCount(patternMap)
      .slice(0, 15)
      .map((p) => ({
        pattern: p.key,
        count: p.count,
        percentage: Math.round((p.count / urls.length) * 100),
      })),
    depthAnalysis: Array.from(depthMap.entries())
      .map(([depth, count]) => ({ depth, count }))
      .sort((a, b) => a.depth - b.depth),
    domainBreakdown: sortByCount(domainMap).map((d) => ({
      domain: d.key,
      count: d.count,
    })),
    fileTypes: sortByCount(fileTypeMap)
      .slice(0, 10)
      .map((f) => ({ extension: f.key, count: f.count })),
    lastmodFreshness: Array.from(freshnessMap.entries()).map(
      ([category, count]) => ({ category, count }),
    ),
    changefreqDistribution: sortByCount(changefreqMap).map((c) => ({
      freq: c.key,
      count: c.count,
    })),
    priorityDistribution: Array.from(priorityMap.entries()).map(
      ([range, count]) => ({ range, count }),
    ),
  };
};

// ==================== SITEMAP GENERATOR ====================

export interface GenerateSitemapInput {
  urls: {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
  }[];
  includeLastmod?: boolean;
  defaultChangefreq?: string;
  defaultPriority?: number;
}

export const generateSitemap = (input: GenerateSitemapInput): string => {
  const urlEntries = input.urls.map((u) => {
    const entry: Record<string, unknown> = { loc: u.loc };
    if (input.includeLastmod !== false && u.lastmod) {
      entry.lastmod = u.lastmod;
    } else if (input.includeLastmod !== false) {
      entry.lastmod = new Date().toISOString().split("T")[0];
    }
    if (u.changefreq || input.defaultChangefreq) {
      entry.changefreq = u.changefreq || input.defaultChangefreq;
    }
    if (u.priority !== undefined || input.defaultPriority !== undefined) {
      entry.priority = u.priority ?? input.defaultPriority;
    }
    return entry;
  });

  const sitemapObj = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    urlset: {
      "@_xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
      url: urlEntries,
    },
  };

  return xmlBuilder.build(sitemapObj);
};

// ==================== SITEMAP INDEX GENERATOR ====================

export interface GenerateSitemapIndexInput {
  sitemaps: { loc: string; lastmod?: string }[];
}

export const generateSitemapIndex = (
  input: GenerateSitemapIndexInput,
): string => {
  const sitemapEntries = input.sitemaps.map((s) => ({
    loc: s.loc,
    lastmod: s.lastmod || new Date().toISOString().split("T")[0],
  }));

  const indexObj = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    sitemapindex: {
      "@_xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
      sitemap: sitemapEntries,
    },
  };

  return xmlBuilder.build(indexObj);
};

// ==================== ROBOTS.TXT GENERATOR ====================

export interface RobotsTxtInput {
  sitemaps: string[];
  userAgentRules: { userAgent: string; allow: string[]; disallow: string[] }[];
  crawlDelay?: number;
}

export const generateRobotsTxt = (input: RobotsTxtInput): string => {
  const lines: string[] = [];

  input.userAgentRules.forEach((rule) => {
    lines.push(`User-agent: ${rule.userAgent}`);
    rule.disallow.forEach((path) => lines.push(`Disallow: ${path}`));
    rule.allow.forEach((path) => lines.push(`Allow: ${path}`));
    if (input.crawlDelay) {
      lines.push(`Crawl-delay: ${input.crawlDelay}`);
    }
    lines.push("");
  });

  input.sitemaps.forEach((sitemap) => {
    lines.push(`Sitemap: ${sitemap}`);
  });

  return lines.join("\n");
};

// ==================== SITEMAP SPLIT ====================

export interface SplitResult {
  sitemaps: { index: number; content: string; urlCount: number }[];
  indexFile: string;
  totalUrls: number;
}

export const splitSitemap = async (
  sitemapUrl: string,
  urlsPerFile: number = 10000,
  baseFileName: string = "sitemap",
): Promise<SplitResult> => {
  const result = await extractSitemapUrls(sitemapUrl, true);
  const urls = result.urls;
  const sitemaps: { index: number; content: string; urlCount: number }[] = [];

  for (let i = 0; i < urls.length; i += urlsPerFile) {
    const chunk = urls.slice(i, i + urlsPerFile);
    const index = Math.floor(i / urlsPerFile) + 1;
    const content = generateSitemap({ urls: chunk });
    sitemaps.push({ index, content, urlCount: chunk.length });
  }

  // Generate index
  const indexSitemaps = sitemaps.map((s) => ({
    loc: `${baseFileName}-${s.index}.xml`,
  }));
  const indexFile = generateSitemapIndex({ sitemaps: indexSitemaps });

  return { sitemaps, indexFile, totalUrls: urls.length };
};

// ==================== SITEMAP FREQUENCY ANALYZER ====================

export interface FrequencyAnalysis {
  changefreqStats: {
    freq: string;
    count: number;
    percentage: number;
    recommendation?: string;
  }[];
  priorityStats: {
    range: string;
    count: number;
    percentage: number;
    avgPriority: number;
  }[];
  recommendations: string[];
  urlsWithoutChangefreq: number;
  urlsWithoutPriority: number;
}

export const analyzeFrequency = async (
  sitemapUrl: string,
): Promise<FrequencyAnalysis> => {
  const result = await extractSitemapUrls(sitemapUrl, true);
  const urls = result.urls;

  const changefreqMap = new Map<string, number>();
  const priorityBuckets = new Map<string, { count: number; sum: number }>();
  let urlsWithoutChangefreq = 0;
  let urlsWithoutPriority = 0;

  urls.forEach((u) => {
    if (u.changefreq) {
      changefreqMap.set(
        u.changefreq,
        (changefreqMap.get(u.changefreq) || 0) + 1,
      );
    } else {
      urlsWithoutChangefreq++;
    }

    if (u.priority !== undefined) {
      const range =
        u.priority >= 0.8
          ? "High (0.8-1.0)"
          : u.priority >= 0.5
            ? "Medium (0.5-0.7)"
            : "Low (0.0-0.4)";
      const bucket = priorityBuckets.get(range) || { count: 0, sum: 0 };
      bucket.count++;
      bucket.sum += u.priority;
      priorityBuckets.set(range, bucket);
    } else {
      urlsWithoutPriority++;
    }
  });

  const recommendations: string[] = [];
  const freqRecommendations: Record<string, string> = {
    always: "Use sparingly - only for real-time content",
    hourly: "Good for news sites, frequently updated pages",
    daily: "Standard for blogs, active content",
    weekly: "Good for product pages, static content",
    monthly: "Archives, rarely updated content",
    yearly: "Legal pages, historical content",
    never: "Use for truly static content only",
  };

  if (urlsWithoutChangefreq > urls.length * 0.5) {
    recommendations.push(
      "Over 50% of URLs lack changefreq - consider adding for better crawl optimization",
    );
  }
  if (urlsWithoutPriority > urls.length * 0.5) {
    recommendations.push(
      "Over 50% of URLs lack priority - consider adding to help search engines prioritize",
    );
  }

  const changefreqStats = Array.from(changefreqMap.entries())
    .map(([freq, count]) => ({
      freq,
      count,
      percentage: Math.round((count / urls.length) * 100),
      recommendation: freqRecommendations[freq],
    }))
    .sort((a, b) => b.count - a.count);

  const priorityStats = Array.from(priorityBuckets.entries())
    .map(([range, data]) => ({
      range,
      count: data.count,
      percentage: Math.round((data.count / urls.length) * 100),
      avgPriority: Math.round((data.sum / data.count) * 100) / 100,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    changefreqStats,
    priorityStats,
    recommendations,
    urlsWithoutChangefreq,
    urlsWithoutPriority,
  };
};
