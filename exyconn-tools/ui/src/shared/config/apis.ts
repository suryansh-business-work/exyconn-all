/**
 * API Configuration
 * Handles local vs production API URL switching
 */

const isLocalDev = import.meta.env.DEV;
const API_BASE_URL = isLocalDev
  ? 'http://localhost:4002/api'
  : (import.meta.env.VITE_API_BASE_URL || 'https://tools-api.exyconn.com') + '/api';

export const APIs = {
  // Base API URL
  baseUrl: API_BASE_URL,

  // Contact Extractor
  contactExtractor: {
    extract: `${API_BASE_URL}/contact-extractor/extract`,
  },

  // Lead Generator (if backend endpoints needed)
  leadGenerator: {
    search: `${API_BASE_URL}/lead-generator/search`,
  },

  // Sitemap Finder
  sitemapFinder: {
    find: `${API_BASE_URL}/sitemap-finder/find`,
  },

  // PDF Editor
  pdfEditor: {
    merge: `${API_BASE_URL}/pdf-editor/merge`,
    split: `${API_BASE_URL}/pdf-editor/split`,
  },

  // Logo Maker
  logoMaker: {
    removeBackground: `${API_BASE_URL}/logo-maker/remove-background`,
  },

  // Chat Tools
  chatTools: {
    scrapeWebsite: `${API_BASE_URL}/tools/chat-tools/scrape-website`,
    extractDocument: `${API_BASE_URL}/tools/chat-tools/extract-document`,
  },

  // Website & URL Tools
  websiteTools: {
    extractUrls: `${API_BASE_URL}/tools/website-tools/extract-urls`,
    scanPages: `${API_BASE_URL}/tools/website-tools/scan-pages`,
    analyzeStructure: `${API_BASE_URL}/tools/website-tools/analyze-structure`,
  },

  // Sitemap Tools
  sitemapTools: {
    validate: `${API_BASE_URL}/tools/sitemap-tools/validate`,
    extractUrls: `${API_BASE_URL}/tools/sitemap-tools/extract-urls`,
    compare: `${API_BASE_URL}/tools/sitemap-tools/compare`,
    insights: `${API_BASE_URL}/tools/sitemap-tools/insights`,
    generate: `${API_BASE_URL}/tools/sitemap-tools/generate`,
    generateIndex: `${API_BASE_URL}/tools/sitemap-tools/generate-index`,
    generateRobots: `${API_BASE_URL}/tools/sitemap-tools/generate-robots`,
    split: `${API_BASE_URL}/tools/sitemap-tools/split`,
    frequency: `${API_BASE_URL}/tools/sitemap-tools/frequency`,
  },

  // Converter Tools
  converterTools: {
    csvToMarkdown: `${API_BASE_URL}/tools/converter-tools/csv-to-markdown`,
    jsonToMarkdown: `${API_BASE_URL}/tools/converter-tools/json-to-markdown`,
    htmlToMarkdown: `${API_BASE_URL}/tools/converter-tools/html-to-markdown`,
    rtfToMarkdown: `${API_BASE_URL}/tools/converter-tools/rtf-to-markdown`,
    xmlToMarkdown: `${API_BASE_URL}/tools/converter-tools/xml-to-markdown`,
    textToMarkdown: `${API_BASE_URL}/tools/converter-tools/text-to-markdown`,
    webpageToMarkdown: `${API_BASE_URL}/tools/converter-tools/webpage-to-markdown`,
    notionToMarkdown: `${API_BASE_URL}/tools/converter-tools/notion-to-markdown`,
    googleDocsToMarkdown: `${API_BASE_URL}/tools/converter-tools/google-docs-to-markdown`,
    pdfToMarkdown: `${API_BASE_URL}/tools/converter-tools/pdf-to-markdown`,
    docxToMarkdown: `${API_BASE_URL}/tools/converter-tools/docx-to-markdown`,
  },

  // Domain & Network Tools
  domainTools: {
    sslCheck: `${API_BASE_URL}/tools/domain-tools/ssl-check`,
    mxRecords: `${API_BASE_URL}/tools/domain-tools/mx-records`,
    dnsLookup: `${API_BASE_URL}/tools/domain-tools/dns-lookup`,
    whois: `${API_BASE_URL}/tools/domain-tools/whois`,
    domainExpiry: `${API_BASE_URL}/tools/domain-tools/domain-expiry`,
    nameservers: `${API_BASE_URL}/tools/domain-tools/nameservers`,
    domainAvailability: `${API_BASE_URL}/tools/domain-tools/domain-availability`,
    ipLookup: `${API_BASE_URL}/tools/domain-tools/ip-lookup`,
    reverseIP: `${API_BASE_URL}/tools/domain-tools/reverse-ip`,
    httpHeaders: `${API_BASE_URL}/tools/domain-tools/http-headers`,
    websiteStatus: `${API_BASE_URL}/tools/domain-tools/website-status`,
    pageSpeed: `${API_BASE_URL}/tools/domain-tools/page-speed`,
    blacklistCheck: `${API_BASE_URL}/tools/domain-tools/blacklist-check`,
    sslExpiry: `${API_BASE_URL}/tools/domain-tools/ssl-expiry`,
    txtRecords: `${API_BASE_URL}/tools/domain-tools/txt-records`,
    cnameCheck: `${API_BASE_URL}/tools/domain-tools/cname-check`,
    subdomains: `${API_BASE_URL}/tools/domain-tools/subdomains`,
    domainAge: `${API_BASE_URL}/tools/domain-tools/domain-age`,
    redirectCheck: `${API_BASE_URL}/tools/domain-tools/redirect-check`,
    openPorts: `${API_BASE_URL}/tools/domain-tools/open-ports`,
  },

  // SEO Tools
  seoTools: {
    seoCheck: `${API_BASE_URL}/tools/seo-tools/seo-check`,
    serpSimulator: `${API_BASE_URL}/tools/seo-tools/serp-simulator`,
    plagiarismCheck: `${API_BASE_URL}/tools/seo-tools/plagiarism-check`,
    summary: `${API_BASE_URL}/tools/seo-tools/summary`,
    rewrite: `${API_BASE_URL}/tools/seo-tools/rewrite`,
    gbpDescription: `${API_BASE_URL}/tools/seo-tools/gbp-description`,
    keywordSuggest: `${API_BASE_URL}/tools/seo-tools/keyword-suggest`,
    backlinkAnalyze: `${API_BASE_URL}/tools/seo-tools/backlink-analyze`,
    trafficAnalyze: `${API_BASE_URL}/tools/seo-tools/traffic-analyze`,
    competitorAnalyze: `${API_BASE_URL}/tools/seo-tools/competitor-analyze`,
    placeSearch: `${API_BASE_URL}/tools/seo-tools/place-search`,
  },
};

export { isLocalDev };
export default APIs;
