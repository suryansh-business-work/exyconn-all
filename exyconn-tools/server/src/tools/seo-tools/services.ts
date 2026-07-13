import axios from "axios";
import * as cheerio from "cheerio";

// Helper: clean URL
function cleanUrl(input: string): string {
  let url = input.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
}

function cleanDomain(input: string): string {
  return input.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
}

// ---- SEO Checker ----
export async function seoCheck(url: string) {
  const targetUrl = cleanUrl(url);
  const { data: html } = await axios.get(targetUrl, {
    timeout: 15000,
    headers: { "User-Agent": "ExyconnSEOBot/1.0" },
  });
  const $ = cheerio.load(html);

  const title = $("title").text().trim();
  const metaDescription = $('meta[name="description"]').attr("content") || "";
  const metaKeywords = $('meta[name="keywords"]').attr("content") || "";
  const canonical = $('link[rel="canonical"]').attr("href") || "";
  const robots = $('meta[name="robots"]').attr("content") || "";
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  const ogDescription = $('meta[property="og:description"]').attr("content") || "";
  const ogImage = $('meta[property="og:image"]').attr("content") || "";
  const twitterCard = $('meta[name="twitter:card"]').attr("content") || "";
  const viewport = $('meta[name="viewport"]').attr("content") || "";
  const charset = $("meta[charset]").attr("charset") || $('meta[http-equiv="Content-Type"]').attr("content") || "";
  const lang = $("html").attr("lang") || "";
  const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr("href") || "";

  // Headings analysis
  const headings: Record<string, string[]> = {};
  ["h1", "h2", "h3", "h4", "h5", "h6"].forEach((tag) => {
    const items: string[] = [];
    $(tag).each((_, el) => { items.push($(el).text().trim()); });
    if (items.length > 0) headings[tag] = items;
  });

  // Images analysis
  const images = { total: 0, withAlt: 0, withoutAlt: 0, missingAlt: [] as string[] };
  $("img").each((_, el) => {
    images.total++;
    const alt = $(el).attr("alt");
    if (alt && alt.trim()) images.withAlt++;
    else {
      images.withoutAlt++;
      const src = $(el).attr("src") || "unknown";
      if (images.missingAlt.length < 10) images.missingAlt.push(src);
    }
  });

  // Links analysis
  const links = { internal: 0, external: 0, nofollow: 0, total: 0 };
  const domain = cleanDomain(targetUrl);
  $("a[href]").each((_, el) => {
    links.total++;
    const href = $(el).attr("href") || "";
    const rel = $(el).attr("rel") || "";
    if (rel.includes("nofollow")) links.nofollow++;
    if (href.startsWith("/") || href.includes(domain)) links.internal++;
    else if (href.startsWith("http")) links.external++;
  });

  // Word count
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.split(" ").filter(Boolean).length;

  // Schema markup
  const schemaMarkup: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "{}");
      schemaMarkup.push(json["@type"] || "Unknown");
    } catch {
      /* ignore */
    }
  });

  // Issues and recommendations
  const issues: Array<{ type: string; severity: string; message: string }> = [];
  if (!title) issues.push({ type: "title", severity: "critical", message: "Missing page title" });
  else if (title.length > 60) issues.push({ type: "title", severity: "warning", message: `Title too long (${title.length} chars, max 60)` });
  else if (title.length < 30) issues.push({ type: "title", severity: "info", message: `Title might be too short (${title.length} chars)` });

  if (!metaDescription) issues.push({ type: "meta_description", severity: "critical", message: "Missing meta description" });
  else if (metaDescription.length > 160) issues.push({ type: "meta_description", severity: "warning", message: `Meta description too long (${metaDescription.length} chars, max 160)` });
  else if (metaDescription.length < 70) issues.push({ type: "meta_description", severity: "info", message: `Meta description might be too short (${metaDescription.length} chars)` });

  if (!headings.h1 || headings.h1.length === 0) issues.push({ type: "h1", severity: "critical", message: "Missing H1 tag" });
  else if (headings.h1.length > 1) issues.push({ type: "h1", severity: "warning", message: `Multiple H1 tags found (${headings.h1.length})` });

  if (!canonical) issues.push({ type: "canonical", severity: "warning", message: "Missing canonical URL" });
  if (!viewport) issues.push({ type: "viewport", severity: "critical", message: "Missing viewport meta tag" });
  if (!lang) issues.push({ type: "language", severity: "warning", message: "Missing lang attribute on <html>" });
  if (images.withoutAlt > 0) issues.push({ type: "images", severity: "warning", message: `${images.withoutAlt} image(s) missing alt text` });
  if (!ogTitle) issues.push({ type: "og", severity: "info", message: "Missing Open Graph title" });
  if (!favicon) issues.push({ type: "favicon", severity: "info", message: "Missing favicon" });
  if (schemaMarkup.length === 0) issues.push({ type: "schema", severity: "info", message: "No structured data (schema.org) found" });

  const score = Math.max(0, 100 - issues.reduce((acc, i) => acc + (i.severity === "critical" ? 15 : i.severity === "warning" ? 8 : 3), 0));

  return {
    url: targetUrl,
    score,
    title: { text: title, length: title.length },
    metaDescription: { text: metaDescription, length: metaDescription.length },
    metaKeywords,
    canonical,
    robots,
    openGraph: { title: ogTitle, description: ogDescription, image: ogImage },
    twitterCard,
    viewport,
    charset,
    language: lang,
    favicon,
    headings,
    images,
    links,
    wordCount,
    schemaMarkup,
    issues,
  };
}

// ---- SERP Simulator ----
export function serpSimulator(title: string, description: string, url: string) {
  const titleLength = title.length;
  const descLength = description.length;
  const issues: Array<{ field: string; message: string; severity: string }> = [];

  if (titleLength > 60) issues.push({ field: "title", message: `Title is ${titleLength - 60} chars over the 60 char limit`, severity: "warning" });
  if (titleLength < 30) issues.push({ field: "title", message: "Title is too short for optimal SEO", severity: "info" });
  if (descLength > 160) issues.push({ field: "description", message: `Description is ${descLength - 160} chars over the 160 char limit`, severity: "warning" });
  if (descLength < 70) issues.push({ field: "description", message: "Description is too short for optimal SEO", severity: "info" });
  if (!url.startsWith("http")) issues.push({ field: "url", message: "URL should include protocol (https://)", severity: "warning" });

  return {
    preview: {
      title: titleLength > 60 ? title.substring(0, 57) + "..." : title,
      description: descLength > 160 ? description.substring(0, 157) + "..." : description,
      url: url,
      displayUrl: cleanDomain(url),
    },
    analysis: {
      title: { text: title, length: titleLength, maxLength: 60, pixelWidth: Math.min(titleLength * 8, 600) },
      description: { text: description, length: descLength, maxLength: 160 },
      url: { text: url, displayUrl: cleanDomain(url) },
    },
    issues,
    score: Math.max(0, 100 - issues.length * 15),
  };
}

// ---- Plagiarism Checker (basic text similarity) ----
export function checkPlagiarism(text: string) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const words = text.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const uniquenessRatio = uniqueWords.size / words.length;

  // Check for repeated phrases
  const phrases: Record<string, number> = {};
  for (let i = 0; i < words.length - 3; i++) {
    const phrase = words.slice(i, i + 4).join(" ").toLowerCase();
    phrases[phrase] = (phrases[phrase] || 0) + 1;
  }
  const repeatedPhrases = Object.entries(phrases).filter(([, count]) => count > 1).map(([phrase, count]) => ({ phrase, count }));

  return {
    totalWords: words.length,
    uniqueWords: uniqueWords.size,
    uniquenessScore: Math.round(uniquenessRatio * 100),
    totalSentences: sentences.length,
    averageWordsPerSentence: sentences.length ? Math.round(words.length / sentences.length) : 0,
    repeatedPhrases: repeatedPhrases.slice(0, 20),
    readabilityLevel: words.length / sentences.length < 15 ? "Easy" : words.length / sentences.length < 20 ? "Moderate" : "Complex",
    note: "This is a basic uniqueness analysis. For comprehensive plagiarism detection, consider using a dedicated plagiarism detection API.",
  };
}

// ---- Summary Generator ----
export function generateSummary(text: string, maxSentences: number = 5) {
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 15);
  if (sentences.length === 0) return { summary: text, originalLength: text.length, summaryLength: text.length, sentences: 0 };

  // Simple extractive summarization based on word frequency
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "shall", "can", "need", "dare", "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through", "during", "before", "after", "above", "below", "between", "out", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "because", "but", "and", "or", "if", "while", "that", "this", "it", "its", "i", "me", "my"]);
  words.forEach((w) => { if (!stopWords.has(w) && w.length > 2) wordFreq[w] = (wordFreq[w] || 0) + 1; });

  const scored = sentences.map((s) => ({
    sentence: s,
    score: s.toLowerCase().split(/\s+/).reduce((acc, w) => acc + (wordFreq[w] || 0), 0),
  }));

  scored.sort((a, b) => b.score - a.score);
  const topSentences = scored.slice(0, Math.min(maxSentences, sentences.length));
  const summary = topSentences.map((s) => s.sentence).join(". ") + ".";

  return {
    summary,
    originalLength: text.length,
    summaryLength: summary.length,
    compressionRatio: Math.round((1 - summary.length / text.length) * 100),
    totalSentences: sentences.length,
    summarySentences: topSentences.length,
  };
}

// ---- Paragraph/Sentence Rewriter (basic) ----
export function rewriteText(text: string, style: string = "professional") {
  // This provides structural analysis - actual rewriting requires an LLM/AI API
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);

  return {
    original: text,
    wordCount: words.length,
    sentenceCount: sentences.length,
    averageSentenceLength: sentences.length ? Math.round(words.length / sentences.length) : 0,
    readability: words.length / (sentences.length || 1) < 15 ? "Easy" : words.length / (sentences.length || 1) < 20 ? "Moderate" : "Complex",
    suggestions: [
      sentences.some((s) => s.split(/\s+/).length > 25) ? "Break long sentences into shorter ones" : null,
      words.length < 50 ? "Consider adding more detail" : null,
      new Set(words.map((w) => w.toLowerCase())).size / words.length < 0.5 ? "Use more varied vocabulary" : null,
      !text.includes(",") ? "Add commas for better readability" : null,
    ].filter(Boolean),
    style,
    note: "For AI-powered rewriting, configure your OpenAI API key in API Keys & Secrets. This tool provides text analysis and suggestions.",
  };
}

// ---- GBP Description Generator ----
export function generateGBPDescription(
  businessName: string,
  businessType: string,
  location: string,
  services: string[],
  uniquePoints: string[]
) {
  const serviceList = services.length > 0 ? services.join(", ") : "various services";
  const usp = uniquePoints.length > 0 ? uniquePoints.join(". ") + "." : "";

  const descriptions = [
    `${businessName} is a trusted ${businessType} located in ${location}. We specialize in ${serviceList}. ${usp} Visit us today to experience quality service and expert solutions tailored to your needs.`,
    `Looking for a reliable ${businessType} in ${location}? ${businessName} offers ${serviceList} with a commitment to excellence. ${usp} Contact us to learn more about how we can help you.`,
    `Welcome to ${businessName}, your go-to ${businessType} in ${location}. Our team provides ${serviceList} with dedication and expertise. ${usp} Reach out today for a consultation.`,
  ];

  return {
    businessName,
    businessType,
    location,
    descriptions: descriptions.map((d, i) => ({
      variant: i + 1,
      text: d,
      length: d.length,
      isWithinLimit: d.length <= 750,
    })),
    tips: [
      "Keep your description under 750 characters",
      "Include relevant keywords naturally",
      "Mention your location and service area",
      "Highlight what makes you unique",
      "Include a call to action",
    ],
  };
}

// ---- Keyword Suggest (Google Autocomplete) ----
export async function keywordSuggest(keyword: string) {
  const encodedKw = encodeURIComponent(keyword.trim());
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodedKw}`;
  const { data } = await axios.get(url, {
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  // Google returns [query, [suggestions]]
  const suggestions: string[] = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];

  // Also fetch with common modifiers for more results
  const modifiers = ["how to", "best", "what is", "why", "vs"];
  const extraSuggestions: string[] = [];
  const extraPromises = modifiers.map(async (mod) => {
    try {
      const modUrl = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(mod + " " + keyword.trim())}`;
      const { data: modData } = await axios.get(modUrl, { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });
      if (Array.isArray(modData) && Array.isArray(modData[1])) {
        extraSuggestions.push(...modData[1]);
      }
    } catch {
      /* ignore individual failures */
    }
  });
  await Promise.all(extraPromises);

  const allKeywords = [...new Set([...suggestions, ...extraSuggestions])];
  return {
    seed: keyword,
    totalSuggestions: allKeywords.length,
    keywords: allKeywords.map((kw) => ({
      keyword: kw,
      wordCount: kw.split(/\s+/).length,
      charCount: kw.length,
    })),
  };
}

// ---- Backlink Analyzer (real link analysis from page) ----
export async function backlinkAnalyze(url: string) {
  const targetUrl = cleanUrl(url);
  const targetDomain = cleanDomain(targetUrl);
  const { data: html } = await axios.get(targetUrl, {
    timeout: 15000,
    headers: { "User-Agent": "ExyconnSEOBot/1.0" },
  });
  const $ = cheerio.load(html);

  const internalLinks: Array<{ url: string; anchor: string; nofollow: boolean }> = [];
  const externalLinks: Array<{ url: string; anchor: string; nofollow: boolean; domain: string }> = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const anchor = $(el).text().trim().substring(0, 100);
    const rel = $(el).attr("rel") || "";
    const isNofollow = rel.includes("nofollow");

    if (href.startsWith("http") && !href.includes(targetDomain)) {
      try {
        const linkDomain = new URL(href).hostname;
        externalLinks.push({ url: href, anchor: anchor || linkDomain, nofollow: isNofollow, domain: linkDomain });
      } catch {
        /* invalid URL */
      }
    } else if (href.startsWith("/") || href.includes(targetDomain)) {
      internalLinks.push({ url: href, anchor: anchor || href, nofollow: isNofollow });
    }
  });

  // Unique external domains
  const uniqueDomains = [...new Set(externalLinks.map((l) => l.domain))];

  return {
    domain: targetDomain,
    analyzedUrl: targetUrl,
    internalLinks: {
      total: internalLinks.length,
      links: internalLinks.slice(0, 50),
    },
    externalLinks: {
      total: externalLinks.length,
      dofollow: externalLinks.filter((l) => !l.nofollow).length,
      nofollow: externalLinks.filter((l) => l.nofollow).length,
      uniqueDomains: uniqueDomains.length,
      domainList: uniqueDomains.slice(0, 50),
      links: externalLinks.slice(0, 50),
    },
    summary: {
      totalLinks: internalLinks.length + externalLinks.length,
      internalCount: internalLinks.length,
      externalCount: externalLinks.length,
      uniqueExternalDomains: uniqueDomains.length,
    },
  };
}

// ---- Traffic Analyzer (real page metrics from HTML) ----
export async function trafficAnalyze(url: string) {
  const targetUrl = cleanUrl(url);
  const targetDomain = cleanDomain(targetUrl);

  const startTime = Date.now();
  const { data: html, headers: responseHeaders } = await axios.get(targetUrl, {
    timeout: 15000,
    headers: { "User-Agent": "ExyconnSEOBot/1.0" },
  });
  const loadTimeMs = Date.now() - startTime;

  const $ = cheerio.load(html);

  // Page size
  const pageSizeBytes = Buffer.byteLength(html, "utf-8");

  // Resource counts
  const scripts = $("script[src]").length;
  const stylesheets = $('link[rel="stylesheet"]').length;
  const images = $("img").length;
  const iframes = $("iframe").length;

  // Word count
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.split(" ").filter(Boolean).length;

  // Internal & external links
  const internalLinks = new Set<string>();
  const externalDomains = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.startsWith("/") || href.includes(targetDomain)) {
      internalLinks.add(href.startsWith("/") ? href : new URL(href).pathname);
    } else if (href.startsWith("http")) {
      try { externalDomains.add(new URL(href).hostname); } catch { /* ignore */ }
    }
  });

  // Social links detection
  const socialPlatforms = ["facebook.com", "twitter.com", "x.com", "instagram.com", "linkedin.com", "youtube.com", "tiktok.com", "pinterest.com"];
  const socialPresence: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    socialPlatforms.forEach((platform) => {
      if (href.includes(platform) && !socialPresence.includes(platform)) {
        socialPresence.push(platform);
      }
    });
  });

  // Meta info
  const title = $("title").text().trim();
  const metaDescription = $('meta[name="description"]').attr("content") || "";
  const ogType = $('meta[property="og:type"]').attr("content") || "";
  const generator = $('meta[name="generator"]').attr("content") || "";

  // Tech detection
  const technologies: string[] = [];
  if (generator) technologies.push(generator);
  if (html.includes("wp-content") || html.includes("wordpress")) technologies.push("WordPress");
  if (html.includes("shopify")) technologies.push("Shopify");
  if (html.includes("react") || html.includes("__next")) technologies.push("React");
  if (html.includes("angular")) technologies.push("Angular");
  if (html.includes("vue")) technologies.push("Vue.js");
  if ($('script[src*="gtag"]').length || $('script[src*="google-analytics"]').length) technologies.push("Google Analytics");
  if ($('script[src*="gtm"]').length) technologies.push("Google Tag Manager");
  if (html.includes("cloudflare")) technologies.push("Cloudflare");

  const server = responseHeaders["server"] || "";
  if (server) technologies.push(`Server: ${server}`);

  return {
    domain: targetDomain,
    url: targetUrl,
    performance: {
      loadTimeMs,
      pageSizeKB: Math.round(pageSizeBytes / 1024),
      scripts,
      stylesheets,
      images,
      iframes,
    },
    content: {
      title,
      metaDescription,
      wordCount,
      internalPages: internalLinks.size,
      externalDomains: externalDomains.size,
    },
    social: {
      platforms: socialPresence,
      count: socialPresence.length,
    },
    technology: {
      detected: [...new Set(technologies)],
      ogType,
    },
    links: {
      internalPages: internalLinks.size,
      externalDomains: externalDomains.size,
      externalDomainList: [...externalDomains].slice(0, 30),
    },
  };
}

// ---- Competitor Analyzer (finds related sites from links/meta on page) ----
export async function competitorAnalyze(url: string) {
  const targetUrl = cleanUrl(url);
  const targetDomain = cleanDomain(targetUrl);
  const { data: html } = await axios.get(targetUrl, {
    timeout: 15000,
    headers: { "User-Agent": "ExyconnSEOBot/1.0" },
  });
  const $ = cheerio.load(html);

  // Collect all external domains from links
  const domainCounts: Record<string, { count: number; anchors: string[] }> = {};
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.startsWith("http") && !href.includes(targetDomain)) {
      try {
        const linkDomain = new URL(href).hostname;
        // Skip social media, CDNs, and common utility domains
        const skipDomains = ["facebook.com", "twitter.com", "x.com", "instagram.com", "linkedin.com",
          "youtube.com", "google.com", "googleapis.com", "gstatic.com", "cloudflare.com",
          "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com", "w3.org",
          "schema.org", "gravatar.com", "wp.com"
        ];
        if (skipDomains.some((d) => linkDomain.includes(d))) return;

        if (!domainCounts[linkDomain]) domainCounts[linkDomain] = { count: 0, anchors: [] };
        domainCounts[linkDomain].count++;
        const anchor = $(el).text().trim();
        if (anchor && domainCounts[linkDomain].anchors.length < 3) {
          domainCounts[linkDomain].anchors.push(anchor.substring(0, 60));
        }
      } catch {
        /* invalid URL */
      }
    }
  });

  // Extract industry keywords from title, description, h1
  const title = $("title").text().trim();
  const metaDescription = $('meta[name="description"]').attr("content") || "";
  const h1 = $("h1").first().text().trim();
  const keywords = $('meta[name="keywords"]').attr("content") || "";

  // Sort domains by mention count
  const relatedSites = Object.entries(domainCounts)
    .map(([domain, info]) => ({
      domain,
      mentions: info.count,
      anchors: info.anchors,
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 20);

  return {
    analyzedDomain: targetDomain,
    analyzedUrl: targetUrl,
    siteContext: {
      title,
      description: metaDescription,
      h1,
      keywords,
    },
    relatedSites,
    totalExternalDomains: Object.keys(domainCounts).length,
    note: "Related sites are determined by analyzing outgoing links from your website. Sites with more mentions are likely more relevant to your niche.",
  };
}

// ---- Place Search (Google Places API) ----
export async function searchPlaces(query: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
  const { data } = await axios.get(url, {
    params: { query, key: apiKey },
    timeout: 10000,
  });

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || `Google Places API error: ${data.status}`);
  }

  const results = (data.results || []).slice(0, 10).map((place: { name: string; formatted_address: string; place_id: string; rating?: number; user_ratings_total?: number }) => ({
    name: place.name,
    address: place.formatted_address,
    placeId: place.place_id,
    rating: place.rating || null,
    totalReviews: place.user_ratings_total || 0,
  }));

  return { query, totalResults: results.length, results };
}
