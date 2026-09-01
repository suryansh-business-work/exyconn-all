import { Request, Response } from 'express';

interface ToolDoc {
  name: string;
  slug: string;
  actions: string[];
}

const COMMON_ENDPOINTS = [
  'GET /api/common/imagekit/auth',
  'POST /api/common/imagekit/upload',
  'POST /api/common/imagekit/upload-base64',
  'DELETE /api/common/imagekit/delete/:fileId',
  'GET /api/common/email/verify',
  'POST /api/common/email/send',
  'POST /api/common/email/send-signature-test',
];

// Every tool endpoint is a POST under /api/tools/<slug>/<action>
const TOOLS: ToolDoc[] = [
  {
    name: 'Logo Set',
    slug: 'logo-set',
    actions: [
      'remove-background',
      'remove-background-base64',
      'remove-background-removebg',
    ],
  },
  {
    name: 'Image Tools',
    slug: 'image-tools',
    actions: ['upscale', 'remove-background'],
  },
  {
    name: 'PDF Tools',
    slug: 'pdf-tools',
    actions: ['protect', 'unlock'],
  },
  {
    name: 'Office Tools',
    slug: 'office-tools',
    actions: ['office-to-pdf'],
  },
  {
    name: 'Contact Extractor',
    slug: 'contact-extractor',
    actions: ['extract'],
  },
  {
    name: 'Sitemap Finder',
    slug: 'sitemap-finder',
    actions: ['find'],
  },
  {
    name: 'Chat Tools',
    slug: 'chat-tools',
    actions: ['scrape-website', 'extract-document'],
  },
  {
    name: 'Website Tools',
    slug: 'website-tools',
    actions: ['extract-urls', 'scan-pages', 'analyze-structure'],
  },
  {
    name: 'Sitemap Tools',
    slug: 'sitemap-tools',
    actions: [
      'validate',
      'extract-urls',
      'compare',
      'insights',
      'generate',
      'generate-index',
      'generate-robots',
      'split',
      'frequency',
    ],
  },
  {
    name: 'Converter Tools',
    slug: 'converter-tools',
    actions: [
      'csv-to-markdown',
      'json-to-markdown',
      'html-to-markdown',
      'rtf-to-markdown',
      'xml-to-markdown',
      'text-to-markdown',
      'webpage-to-markdown',
      'notion-to-markdown',
      'google-docs-to-markdown',
      'pdf-to-markdown',
      'docx-to-markdown',
    ],
  },
  {
    name: 'Domain Tools',
    slug: 'domain-tools',
    actions: [
      'ssl-check',
      'mx-records',
      'dns-lookup',
      'whois',
      'domain-expiry',
      'nameservers',
      'domain-availability',
      'ip-lookup',
      'reverse-ip',
      'http-headers',
      'website-status',
      'page-speed',
      'blacklist-check',
      'ssl-expiry',
      'txt-records',
      'cname-check',
      'subdomains',
      'domain-age',
      'redirect-check',
      'open-ports',
    ],
  },
  {
    name: 'SEO Tools',
    slug: 'seo-tools',
    actions: [
      'seo-check',
      'serp-simulator',
      'plagiarism-check',
      'summary',
      'rewrite',
      'gbp-description',
      'keyword-suggest',
      'backlink-analyze',
      'traffic-analyze',
      'competitor-analyze',
      'place-search',
    ],
  },
];

export function apiDocsHandler(_req: Request, res: Response) {
  res.json({
    name: 'Creative Tools API',
    version: '1.0.0',
    common: {
      endpoints: COMMON_ENDPOINTS,
    },
    tools: TOOLS.map(({ name, slug, actions }) => ({
      name,
      slug,
      endpoints: actions.map((action) => `POST /api/tools/${slug}/${action}`),
    })),
  });
}
