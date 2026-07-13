import axios from "axios";
import * as cheerio from "cheerio";

export interface ExtractedUrl {
  url: string;
  text: string;
  type: "internal" | "external";
  isResource: boolean;
}

export interface PageInfo {
  url: string;
  title: string;
  description: string;
  depth: number;
  statusCode?: number;
  wordCount: number;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  images: number;
  links: number;
}

export interface SiteStructure {
  baseUrl: string;
  totalPages: number;
  totalInternalLinks: number;
  totalExternalLinks: number;
  maxDepth: number;
  pages: StructurePage[];
  linkMap: { [key: string]: string[] };
  orphanPages: string[];
}

export interface StructurePage {
  url: string;
  title: string;
  incomingLinks: number;
  outgoingLinks: number;
  depth: number;
}

const normalizeUrl = (href: string, baseUrl: string): string | null => {
  try {
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      return null;
    }
    const url = new URL(href, baseUrl);
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
};

const isInternalUrl = (url: string, baseUrl: string): boolean => {
  try {
    const urlObj = new URL(url);
    const baseObj = new URL(baseUrl);
    return urlObj.hostname === baseObj.hostname;
  } catch {
    return false;
  }
};

const isResourceUrl = (url: string): boolean => {
  const resourceExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".zip",
    ".rar",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".webp",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
  ];
  return resourceExtensions.some((ext) => url.toLowerCase().includes(ext));
};

const fetchPage = async (
  url: string,
): Promise<{ html: string; statusCode: number } | null> => {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    });
    return { html: response.data, statusCode: response.status };
  } catch {
    return null;
  }
};

export const extractUrls = async (
  url: string,
  maxUrls: number = 500,
): Promise<ExtractedUrl[]> => {
  const pageData = await fetchPage(url);
  if (!pageData) {
    throw new Error("Failed to fetch the website");
  }

  const $ = cheerio.load(pageData.html);
  const urls: ExtractedUrl[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const normalizedUrl = normalizeUrl(href, url);
    if (!normalizedUrl || seen.has(normalizedUrl)) return;

    seen.add(normalizedUrl);
    urls.push({
      url: normalizedUrl,
      text: $(el).text().trim().substring(0, 100) || "[No text]",
      type: isInternalUrl(normalizedUrl, url) ? "internal" : "external",
      isResource: isResourceUrl(normalizedUrl),
    });

    if (urls.length >= maxUrls) return false;
  });

  return urls;
};

export const scanPages = async (
  url: string,
  maxPages: number = 20,
): Promise<PageInfo[]> => {
  const baseUrl = new URL(url).origin;
  const visited = new Set<string>();
  const toVisit: { url: string; depth: number }[] = [{ url, depth: 0 }];
  const pages: PageInfo[] = [];

  while (toVisit.length > 0 && pages.length < maxPages) {
    const current = toVisit.shift();
    if (!current || visited.has(current.url)) continue;

    visited.add(current.url);
    const pageData = await fetchPage(current.url);
    if (!pageData) continue;

    const $ = cheerio.load(pageData.html);

    // Remove scripts and styles for word count
    $("script, style, noscript").remove();

    const headings = {
      h1: $("h1")
        .map((_, el) => $(el).text().trim())
        .get()
        .slice(0, 5),
      h2: $("h2")
        .map((_, el) => $(el).text().trim())
        .get()
        .slice(0, 10),
      h3: $("h3")
        .map((_, el) => $(el).text().trim())
        .get()
        .slice(0, 10),
    };

    const pageInfo: PageInfo = {
      url: current.url,
      title: $("title").text().trim() || "[No Title]",
      description: $('meta[name="description"]').attr("content")?.trim() || "",
      depth: current.depth,
      statusCode: pageData.statusCode,
      wordCount: $("body").text().replace(/\s+/g, " ").trim().split(/\s+/)
        .length,
      headings,
      images: $("img").length,
      links: $("a[href]").length,
    };

    pages.push(pageInfo);

    // Find more internal links to scan (only if depth < 2)
    if (current.depth < 2) {
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const normalizedUrl = normalizeUrl(href, current.url);
        if (
          normalizedUrl &&
          isInternalUrl(normalizedUrl, baseUrl) &&
          !visited.has(normalizedUrl) &&
          !isResourceUrl(normalizedUrl)
        ) {
          toVisit.push({ url: normalizedUrl, depth: current.depth + 1 });
        }
      });
    }
  }

  return pages;
};

export const analyzeStructure = async (
  url: string,
  maxPages: number = 30,
): Promise<SiteStructure> => {
  const baseUrl = new URL(url).origin;
  const visited = new Set<string>();
  const toVisit: { url: string; depth: number }[] = [{ url, depth: 0 }];
  const pages: StructurePage[] = [];
  const linkMap: { [key: string]: string[] } = {};
  const incomingLinks: { [key: string]: number } = {};

  while (toVisit.length > 0 && pages.length < maxPages) {
    const current = toVisit.shift();
    if (!current || visited.has(current.url)) continue;

    visited.add(current.url);
    const pageData = await fetchPage(current.url);
    if (!pageData) continue;

    const $ = cheerio.load(pageData.html);
    const title = $("title").text().trim() || "[No Title]";
    const outgoingUrls: string[] = [];

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const normalizedUrl = normalizeUrl(href, current.url);
      if (
        normalizedUrl &&
        isInternalUrl(normalizedUrl, baseUrl) &&
        !isResourceUrl(normalizedUrl)
      ) {
        outgoingUrls.push(normalizedUrl);
        incomingLinks[normalizedUrl] = (incomingLinks[normalizedUrl] || 0) + 1;
        if (!visited.has(normalizedUrl) && current.depth < 2) {
          toVisit.push({ url: normalizedUrl, depth: current.depth + 1 });
        }
      }
    });

    linkMap[current.url] = [...new Set(outgoingUrls)];

    pages.push({
      url: current.url,
      title,
      incomingLinks: 0, // Will be updated after crawl
      outgoingLinks: outgoingUrls.length,
      depth: current.depth,
    });
  }

  // Update incoming links count
  pages.forEach((page) => {
    page.incomingLinks = incomingLinks[page.url] || 0;
  });

  // Find orphan pages (pages with no incoming links except the homepage)
  const orphanPages = pages
    .filter((p) => p.incomingLinks === 0 && p.depth > 0)
    .map((p) => p.url);

  // Count internal/external links
  let totalInternalLinks = 0;
  const totalExternalLinks = 0;
  pages.forEach((p) => {
    totalInternalLinks += linkMap[p.url]?.length || 0;
  });

  return {
    baseUrl,
    totalPages: pages.length,
    totalInternalLinks,
    totalExternalLinks,
    maxDepth: Math.max(...pages.map((p) => p.depth)),
    pages: pages.sort((a, b) => b.incomingLinks - a.incomingLinks),
    linkMap,
    orphanPages,
  };
};
