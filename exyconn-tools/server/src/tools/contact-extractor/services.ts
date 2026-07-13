import axios from "axios";
import * as cheerio from "cheerio";

export interface ExtractedContact {
  emails: string[];
  phones: string[];
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  addresses: string[];
}

export interface PageResult {
  url: string;
  contacts: ExtractedContact;
  title: string;
}

export interface ExtractionResult {
  baseUrl: string;
  pagesScanned: number;
  totalEmails: string[];
  totalPhones: string[];
  socialLinks: Record<string, string>;
  pages: PageResult[];
}

// Regex patterns for extraction
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX =
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;

const SOCIAL_PATTERNS = {
  facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/gi,
  twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/gi,
  linkedin:
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_-]+/gi,
  instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._]+/gi,
  youtube:
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel|c|user)\/[a-zA-Z0-9_-]+/gi,
};

// User agent to avoid being blocked
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 10000,
      maxRedirects: 5,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

function extractContactsFromHtml(
  html: string,
  _baseUrl: string,
): ExtractedContact {
  const $ = cheerio.load(html);
  const text = $("body").text();

  // Extract emails
  const emails = [...new Set(text.match(EMAIL_REGEX) || [])].filter(
    (email) => !email.includes("example") && !email.includes("test@"),
  );

  // Extract phone numbers
  const phones = [...new Set(text.match(PHONE_REGEX) || [])].filter(
    (phone) => phone.replace(/\D/g, "").length >= 10,
  );

  // Extract social links
  const socialLinks: ExtractedContact["socialLinks"] = {};
  for (const [platform, regex] of Object.entries(SOCIAL_PATTERNS)) {
    const matches = html.match(regex);
    if (matches && matches.length > 0) {
      socialLinks[platform as keyof typeof socialLinks] = matches[0];
    }
  }

  // Extract addresses (look for address tags and common patterns)
  const addresses: string[] = [];
  $("address").each((_, el) => {
    const addr = $(el).text().trim().replace(/\s+/g, " ");
    if (addr && addr.length > 10) {
      addresses.push(addr);
    }
  });

  return { emails, phones, socialLinks, addresses };
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  const baseUrlObj = new URL(baseUrl);

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    try {
      const fullUrl = new URL(href, baseUrl);

      // Only include internal links
      if (fullUrl.hostname === baseUrlObj.hostname) {
        // Skip certain paths
        const skipPatterns = [
          /\.(jpg|jpeg|png|gif|svg|pdf|doc|docx|xls|xlsx|zip|rar)$/i,
          /^mailto:/i,
          /^tel:/i,
          /^javascript:/i,
          /#$/,
        ];

        if (!skipPatterns.some((p) => p.test(fullUrl.href))) {
          links.push(fullUrl.href.split("#")[0]); // Remove hash
        }
      }
    } catch {
      // Invalid URL, skip
    }
  });

  return [...new Set(links)];
}

export async function extractContacts(
  url: string,
  maxPages: number,
  followLinks: boolean,
): Promise<ExtractionResult> {
  const visitedUrls = new Set<string>();
  const urlsToVisit: string[] = [url];
  const pages: PageResult[] = [];
  const allEmails = new Set<string>();
  const allPhones = new Set<string>();
  const allSocialLinks: Record<string, string> = {};

  while (urlsToVisit.length > 0 && visitedUrls.size < maxPages) {
    const currentUrl = urlsToVisit.shift()!;

    if (visitedUrls.has(currentUrl)) continue;
    visitedUrls.add(currentUrl);

    const html = await fetchPage(currentUrl);
    if (!html) continue;

    const $ = cheerio.load(html);
    const title = $("title").text().trim() || currentUrl;
    const contacts = extractContactsFromHtml(html, currentUrl);

    // Collect all data
    contacts.emails.forEach((e) => allEmails.add(e));
    contacts.phones.forEach((p) => allPhones.add(p));
    Object.entries(contacts.socialLinks).forEach(([k, v]) => {
      if (v && !allSocialLinks[k]) allSocialLinks[k] = v;
    });

    pages.push({ url: currentUrl, contacts, title });

    // Add internal links to queue if following links
    if (followLinks && visitedUrls.size < maxPages) {
      const internalLinks = extractInternalLinks(html, currentUrl);
      for (const link of internalLinks) {
        if (!visitedUrls.has(link) && !urlsToVisit.includes(link)) {
          urlsToVisit.push(link);
        }
      }
    }

    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 500));
  }

  return {
    baseUrl: url,
    pagesScanned: visitedUrls.size,
    totalEmails: [...allEmails],
    totalPhones: [...allPhones],
    socialLinks: allSocialLinks,
    pages,
  };
}
