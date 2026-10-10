import { safeRequest } from "../../shared/security/safe-http";
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";

export interface SitemapInfo {
  url: string;
  type: "xml" | "index" | "txt" | "html";
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

// Common sitemap paths to check
const COMMON_SITEMAP_PATHS = [
  "/sitemap.xml",
  "/sitemap_index.xml",
  "/sitemap-index.xml",
  "/sitemapindex.xml",
  "/sitemap1.xml",
  "/sitemap-0.xml",
  "/sitemap/sitemap.xml",
  "/sitemaps/sitemap.xml",
  "/post-sitemap.xml",
  "/page-sitemap.xml",
  "/news-sitemap.xml",
  "/video-sitemap.xml",
  "/image-sitemap.xml",
  "/category-sitemap.xml",
  "/product-sitemap.xml",
  "/wp-sitemap.xml",
  "/sitemap.txt",
  "/sitemap.html",
  "/sitemap",
];

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SitemapFinder/1.0";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function normalizeUrl(inputUrl: string): string {
  let url = inputUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  // Remove trailing slash
  return url.replace(/\/$/, "");
}

function getBaseUrl(inputUrl: string): string {
  const url = new URL(normalizeUrl(inputUrl));
  return `${url.protocol}//${url.hostname}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
}

async function fetchWithTimeout(
  url: string,
  timeout: number = 10000,
): Promise<{
  data: string;
  headers: Record<string, string>;
  status: number;
} | null> {
  try {
    const response = await safeRequest(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/xml, application/xml, text/html, text/plain, */*",
      },
      timeout,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    });

    if (response.status >= 400) {
      return null;
    }

    return {
      data:
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data),
      headers: response.headers as Record<string, string>,
      status: response.status,
    };
  } catch {
    return null;
  }
}

function detectSitemapType(content: string, url: string): SitemapInfo["type"] {
  const lowerUrl = url.toLowerCase();
  const lowerContent = content.toLowerCase().trim();

  // Check for sitemap index
  if (
    lowerContent.includes("<sitemapindex") ||
    lowerContent.includes("sitemapindex>")
  ) {
    return "index";
  }

  // Check for XML sitemap
  if (
    lowerContent.includes("<urlset") ||
    lowerContent.includes("urlset>") ||
    lowerContent.includes("<?xml")
  ) {
    return "xml";
  }

  // Check for text sitemap
  if (
    lowerUrl.endsWith(".txt") ||
    /^https?:\/\//.test(lowerContent.split("\n")[0]?.trim() || "")
  ) {
    return "txt";
  }

  // Check for HTML sitemap
  if (
    lowerContent.includes("<html") ||
    lowerContent.includes("<!doctype html")
  ) {
    return "html";
  }

  return "xml";
}

function countUrlsInSitemap(
  content: string,
  type: SitemapInfo["type"],
): number {
  try {
    switch (type) {
      case "index": {
        const parsed = xmlParser.parse(content);
        const sitemaps = parsed?.sitemapindex?.sitemap;
        if (Array.isArray(sitemaps)) {
          return sitemaps.length;
        }
        return sitemaps ? 1 : 0;
      }
      case "xml": {
        const parsed = xmlParser.parse(content);
        const urls = parsed?.urlset?.url;
        if (Array.isArray(urls)) {
          return urls.length;
        }
        return urls ? 1 : 0;
      }
      case "txt": {
        const lines = content.split("\n").filter((line) => {
          const trimmed = line.trim();
          return (
            trimmed &&
            (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
          );
        });
        return lines.length;
      }
      case "html": {
        const $ = cheerio.load(content);
        return $("a[href]").length;
      }
    }
  } catch {
    return 0;
  }
}

type FetchedSitemap = NonNullable<Awaited<ReturnType<typeof fetchWithTimeout>>>;

interface IndexContext {
  baseUrl: string;
  visitedUrls: Set<string>;
  maxDepth: number;
}

function sizeFromHeaders(headers: Record<string, string>): string | undefined {
  const length = headers["content-length"];
  return length ? formatBytes(Number.parseInt(length)) : undefined;
}

function failedSitemap(url: string, lastModified?: string): SitemapInfo {
  return {
    url,
    type: "xml",
    urlCount: 0,
    lastModified,
    isValid: false,
    errorMessage: "Failed to fetch sitemap",
  };
}

/** Records a fetched sitemap and, when it is an index, every sitemap nested in it. */
async function recordSitemap(
  url: string,
  result: FetchedSitemap,
  type: SitemapInfo["type"],
  ctx: IndexContext,
  nestedDepth: number,
  found: SitemapInfo[],
  lastModified?: string,
): Promise<void> {
  found.push({
    url,
    type,
    urlCount: countUrlsInSitemap(result.data, type),
    lastModified,
    isValid: true,
    size: sizeFromHeaders(result.headers),
  });

  // Recursively parse nested sitemap indexes
  if (type === "index") {
    found.push(
      ...(await parseSitemapIndex(
        result.data,
        ctx.baseUrl,
        ctx.visitedUrls,
        nestedDepth,
        ctx.maxDepth,
      )),
    );
  }
}

async function parseSitemapIndex(
  content: string,
  baseUrl: string,
  visitedUrls: Set<string>,
  depth: number,
  maxDepth: number,
): Promise<SitemapInfo[]> {
  if (depth >= maxDepth) {
    return [];
  }

  const sitemaps: SitemapInfo[] = [];
  const ctx: IndexContext = { baseUrl, visitedUrls, maxDepth };

  try {
    const parsed = xmlParser.parse(content);
    const sitemapEntries = parsed?.sitemapindex?.sitemap;

    if (!sitemapEntries) {
      return [];
    }

    const entries = Array.isArray(sitemapEntries)
      ? sitemapEntries
      : [sitemapEntries];

    for (const entry of entries) {
      const loc = entry?.loc;
      if (!loc || visitedUrls.has(loc)) {
        continue;
      }

      visitedUrls.add(loc);

      const result = await fetchWithTimeout(loc);
      if (result) {
        const type = detectSitemapType(result.data, loc);
        await recordSitemap(
          loc,
          result,
          type,
          ctx,
          depth + 1,
          sitemaps,
          entry?.lastmod,
        );
      } else {
        sitemaps.push(failedSitemap(loc, entry?.lastmod));
      }
    }
  } catch (error) {
    console.error("Error parsing sitemap index:", error);
  }

  return sitemaps;
}

async function parseRobotsTxt(
  robotsTxtContent: string,
  _baseUrl: string,
): Promise<string[]> {
  const sitemapUrls: string[] = [];
  const lines = robotsTxtContent.split("\n");

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (trimmed.startsWith("sitemap:")) {
      const sitemapUrl = line.substring(line.indexOf(":") + 1).trim();
      if (sitemapUrl) {
        sitemapUrls.push(sitemapUrl);
      }
    }
  }

  return sitemapUrls;
}

/** Fetches every sitemap that robots.txt points at. */
async function scanRobotsSitemaps(
  sitemapUrls: string[],
  ctx: IndexContext,
  checkedLocations: string[],
  found: SitemapInfo[],
): Promise<void> {
  for (const sitemapUrl of sitemapUrls) {
    if (ctx.visitedUrls.has(sitemapUrl)) continue;
    ctx.visitedUrls.add(sitemapUrl);
    checkedLocations.push(sitemapUrl);

    const result = await fetchWithTimeout(sitemapUrl);
    if (result) {
      const type = detectSitemapType(result.data, sitemapUrl);
      await recordSitemap(sitemapUrl, result, type, ctx, 1, found);
    } else {
      found.push(failedSitemap(sitemapUrl));
    }
  }
}

/** HTML answers that are not real sitemaps (like soft 404 pages). */
function isSoftNotFoundPage(html: string): boolean {
  const lowerContent = html.toLowerCase();
  return (
    !lowerContent.includes("sitemap") ||
    lowerContent.includes("not found") ||
    lowerContent.includes("404")
  );
}

/** Probes the well-known sitemap locations. */
async function scanCommonPaths(
  ctx: IndexContext,
  checkedLocations: string[],
  found: SitemapInfo[],
): Promise<void> {
  for (const path of COMMON_SITEMAP_PATHS) {
    const sitemapUrl = `${ctx.baseUrl}${path}`;

    if (ctx.visitedUrls.has(sitemapUrl)) continue;
    ctx.visitedUrls.add(sitemapUrl);
    checkedLocations.push(sitemapUrl);

    const result = await fetchWithTimeout(sitemapUrl);
    if (result?.status !== 200) continue;

    const type = detectSitemapType(result.data, sitemapUrl);
    if (type === "html" && isSoftNotFoundPage(result.data)) continue;

    await recordSitemap(sitemapUrl, result, type, ctx, 1, found);
  }
}

export async function findSitemaps(
  url: string,
  checkCommonPaths: boolean,
  parseRobots: boolean,
  maxDepth: number,
): Promise<SitemapResult> {
  const startTime = Date.now();
  const baseUrl = getBaseUrl(url);
  const ctx: IndexContext = {
    baseUrl,
    visitedUrls: new Set<string>(),
    maxDepth,
  };
  const checkedLocations: string[] = [];
  const sitemapsFound: SitemapInfo[] = [];
  let robotsTxtExists = false;
  let robotsTxtUrl: string | undefined;

  // Step 1: Check robots.txt for sitemap references
  if (parseRobots) {
    const robotsUrl = `${baseUrl}/robots.txt`;
    checkedLocations.push(robotsUrl);

    const robotsResult = await fetchWithTimeout(robotsUrl);
    if (robotsResult?.status === 200) {
      robotsTxtExists = true;
      robotsTxtUrl = robotsUrl;

      const sitemapUrls = await parseRobotsTxt(robotsResult.data, baseUrl);
      await scanRobotsSitemaps(
        sitemapUrls,
        ctx,
        checkedLocations,
        sitemapsFound,
      );
    }
  }

  // Step 2: Check common sitemap paths
  if (checkCommonPaths) {
    await scanCommonPaths(ctx, checkedLocations, sitemapsFound);
  }

  // Calculate total URLs
  const totalUrls = sitemapsFound
    .filter((s) => s.isValid && s.type !== "index")
    .reduce((sum, s) => sum + s.urlCount, 0);

  const scanTime = Date.now() - startTime;

  return {
    baseUrl,
    sitemapsFound,
    totalUrls,
    robotsTxtExists,
    robotsTxtUrl,
    checkedLocations,
    scanTime,
  };
}
