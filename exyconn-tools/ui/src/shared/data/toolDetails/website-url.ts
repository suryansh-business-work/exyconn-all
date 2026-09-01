import type { ToolDetailsMap } from './types';

/** Detail content for the "website-url" tool category. Keyed by tool id from toolsData. */
export const websiteUrlToolDetails: ToolDetailsMap = {
  'website-url-extractor': {
    longDescription: [
      'Website URL Extractor pulls every hyperlink out of a public web page in one pass. Paste an address, click Extract, and the Exyconn server fetches the page, parses its HTML, and returns up to 500 URLs together with the anchor text of each link. Every result is classified as internal or external and flagged when it points to a resource such as an image, stylesheet, or script, so you can see at a glance how a page links out.',
      'The results land in a table built for real work. Filter chips narrow the list to internal links, external links, or resource files; a search box matches any part of a URL; and pagination keeps even link-heavy pages responsive. Once you have the subset you need, copy every address to the clipboard in one click or download a CSV that records the URL, anchor text, link type, and resource flag for each row.',
      'The tool suits SEO specialists auditing outbound links, migration teams building redirect maps, and developers who want a quick inventory of a page’s dependencies. Because extraction runs on Exyconn’s server, it works on any publicly reachable site without browser CORS restrictions — no extension to install, no signup, and nothing about your request is kept after the results are returned to your browser.',
    ],
    features: [
      'Extracts up to 500 URLs from any public web page in a single request',
      'Classifies every link as internal or external and flags resource files (images, CSS, scripts)',
      'Captures the anchor text for each extracted link',
      'Filter chips plus URL search to narrow large result sets instantly',
      'Paginated results table that stays fast on link-heavy pages',
      'One-click copy of all filtered URLs to the clipboard',
      'CSV export with URL, anchor text, type, and resource-flag columns',
      'Server-side fetching, so browser CORS limits never block a site',
    ],
    useCases: [
      'Build a redirect map before a site migration by inventorying every URL on key pages',
      'Audit outbound links on a page to see where you send visitors and link equity',
      'Collect competitor navigation and footer links for content-gap research',
      'List a page’s script, stylesheet, and image dependencies during a performance review',
      'Produce a clean URL list to feed into rank checkers or status monitors',
    ],
    howTo: [
      'Paste the full page address, including https://, into the URL field',
      'Click Extract and wait a few seconds while the server fetches and parses the page',
      'Review the summary counts for total, internal, external, and resource URLs',
      'Use the filter chips or the search box to narrow the table to the links you need',
      'Copy the URLs to your clipboard or download the full list as a CSV file',
    ],
    faqs: [
      {
        question: 'Does it crawl the whole website or just one page?',
        answer: 'It extracts the links found in the HTML of the single URL you submit, up to 500 of them. To follow links across many pages, use the Website Page Scanner or Site Structure Analyzer instead.',
      },
      {
        question: 'What counts as a resource URL?',
        answer: 'Links that point to files such as images, stylesheets, scripts, and documents rather than to other web pages. They are flagged separately so one filter chip can include or exclude them.',
      },
      {
        question: 'Is the URL I submit or the extracted data stored anywhere?',
        answer: 'No. The Exyconn server fetches the page, parses it in memory, and sends the results straight back to your browser. Neither the URL you enter nor the extracted links are saved.',
      },
      {
        question: 'Can it extract links from pages behind a login?',
        answer: 'No. The server fetches pages anonymously, so only publicly accessible URLs work. A password-protected page will fail or return only the links on its login screen.',
      },
      {
        question: 'Why are some links on the page missing from the results?',
        answer: 'The extractor parses the HTML the server returns. Links generated purely by client-side JavaScript after the page loads are not in that HTML, so they cannot be captured.',
      },
      {
        question: 'What does the CSV export contain?',
        answer: 'Four columns per link: the URL, its anchor text, whether it is internal or external, and whether it is a resource file.',
      },
    ],
    keywords: [
      'extract urls from website',
      'link extractor online free',
      'get all links from a page',
      'website link scraper',
      'export page links to csv',
      'internal and external link list',
      'find all urls on a page',
      'anchor text extractor',
    ],
    metaDescription:
      'Free online URL extractor — pull every link from any public web page, filter internal, external and resource URLs, then copy or export to CSV.',
  },
  'website-page-scanner': {
    longDescription: [
      'Website Page Scanner crawls a site from any starting URL and builds an on-page report for every page it reaches. The Exyconn server follows internal links from your start page up to the page limit you set (20 by default) and records each page’s title, meta description, HTTP status code, word count, full H1–H3 heading outline, image and link counts, and how many clicks deep it sits in the site.',
      'Each crawled page appears as an expandable card, so you can skim titles and statuses at a glance, then open a card to inspect its meta description, heading hierarchy, and content stats in detail. Thin pages stand out through low word counts, missing H1s show up in the heading outline, and duplicate or absent meta descriptions are easy to spot when the cards sit side by side. One click exports the entire scan as structured JSON for spreadsheets or scripts.',
      'It suits content teams running pre-launch checks, SEO consultants doing fast on-page audits, and agencies documenting a client site before a redesign. The scanner reads the HTML each page actually serves — the same view a search-engine crawler starts from — so content injected only by client-side JavaScript may not appear. Scan data is processed in memory on the server and returned to your browser; nothing is retained afterwards.',
    ],
    features: [
      'Crawls internal links from your start URL up to a configurable page limit (20 by default)',
      'Captures title, meta description, and HTTP status code for every page',
      'Full H1–H3 heading outline per page for structure checks',
      'Word count, image count, and link count reveal thin or heavy pages',
      'Records each page’s crawl depth from the starting URL',
      'Expandable page cards for fast skimming and detailed inspection',
      'One-click JSON export of the complete scan',
    ],
    useCases: [
      'Run a pre-launch check to catch missing titles, meta descriptions, or H1 headings',
      'Audit heading hierarchy across a blog section before an SEO push',
      'Find thin content by comparing word counts across a set of pages',
      'Document the on-page state of a client site before a redesign or migration',
      'Verify HTTP status codes across key pages after a deployment',
    ],
    howTo: [
      'Enter the website URL where the crawl should start',
      'Set the maximum number of pages to scan (20 by default)',
      'Click Scan and let the crawler work through the site’s internal links',
      'Expand any page card to review its title, description, headings, and content stats',
      'Use Export JSON to download the full scan for further analysis',
    ],
    faqs: [
      {
        question: 'How does the scanner decide which pages to visit?',
        answer: 'It starts at the URL you enter and follows the internal links it discovers, recording each page’s depth, until it reaches your page limit. Pages not linked from any crawled page are never reached.',
      },
      {
        question: 'What information is captured for each page?',
        answer: 'The URL, title, meta description, HTTP status code, word count, H1–H3 headings, image count, link count, and crawl depth.',
      },
      {
        question: 'Does it work on JavaScript-heavy single-page apps?',
        answer: 'Partially. The scanner parses the HTML each page serves on first load, so content rendered only by client-side JavaScript may show empty headings or low word counts.',
      },
      {
        question: 'Is my scan data stored on your servers?',
        answer: 'No. The crawl runs in memory on the Exyconn server and the results are returned directly to your browser. Nothing about the site or the scan is kept.',
      },
      {
        question: 'Why does the scan show fewer pages than my site actually has?',
        answer: 'The crawl stops at your max-pages limit and only follows internal links reachable from the start URL. Raise the limit or start from a hub page like the homepage to cover more of the site.',
      },
      {
        question: 'Can I scan a staging site behind a password?',
        answer: 'No. The server fetches pages anonymously, so only publicly reachable URLs can be scanned.',
      },
    ],
    keywords: [
      'website page scanner',
      'crawl website online free',
      'check page titles and meta descriptions',
      'heading structure checker',
      'on-page seo audit tool',
      'website content audit',
      'bulk page word count checker',
      'find pages missing h1',
    ],
    metaDescription:
      'Free website page scanner — crawl a site and audit every page’s title, meta description, headings, word count, images and links. Export as JSON.',
  },
  'site-structure-analyzer': {
    longDescription: [
      'Site Structure Analyzer crawls a website and maps how its pages connect. Starting from the URL you enter, the Exyconn server follows internal links up to your chosen page limit (30 by default) and computes the numbers that define information architecture: total pages and internal links, the deepest click depth reached, and — for every page — how many internal links point in, how many point out, and how far it sits from the start URL.',
      'An overview panel summarizes the crawl, and the structure table lets you sort every page by incoming or outgoing internal links, with depth color-coded so buried pages stand out. The analyzer also lists orphan pages — URLs discovered during the crawl that no other crawled page links to — which are prime candidates for internal-linking fixes, since pages nothing links to are hard for both visitors and search engines to find. The whole model exports as JSON.',
      'Reach for it when planning an internal-linking strategy, flattening a site that buries key pages too deep, or validating architecture after a migration. SEO professionals get click-depth and link-count data without a desktop crawler license, and developers get a machine-readable link graph in one request. Analysis runs on Exyconn’s server against publicly reachable pages, and nothing from the crawl is stored once the results reach your browser.',
    ],
    features: [
      'Crawls internal links from your start URL up to a configurable page limit (30 by default)',
      'Counts incoming and outgoing internal links for every crawled page',
      'Computes each page’s click depth from the starting URL, color-coded in the table',
      'Overview panel with pages analyzed, total internal links, and maximum depth',
      'Detects orphan pages that no other crawled page links to',
      'Sortable table to rank pages by incoming or outgoing links',
      'JSON export of the full link graph and metrics',
    ],
    useCases: [
      'Find orphan pages that need internal links before they can rank',
      'Flatten a deep site by spotting important pages buried 3+ clicks from the homepage',
      'Identify hub pages with the most incoming links before restructuring navigation',
      'Validate internal linking after a migration or URL restructure',
      'Export a link graph for custom analysis or reporting in your own scripts',
    ],
    howTo: [
      'Enter the website URL where the analysis should start',
      'Set the maximum number of pages to crawl (30 by default)',
      'Click Analyze and wait while the server maps the internal link structure',
      'Check the overview panel for totals, max depth, and any orphan pages',
      'Sort the table by incoming or outgoing links to find strong and weak pages',
      'Use Export JSON to download the complete structure data',
    ],
    faqs: [
      {
        question: 'What is an orphan page?',
        answer: 'A page found during the crawl that no other crawled page links to. Orphans are hard for visitors and search engines to discover, so they usually deserve internal links from related content.',
      },
      {
        question: 'What does click depth mean and why does it matter?',
        answer: 'Depth is the minimum number of clicks needed to reach a page from the start URL. Pages buried several clicks deep tend to receive less crawl attention and less link equity, so important pages should stay shallow.',
      },
      {
        question: 'Why do incoming internal links matter for SEO?',
        answer: 'Internal links pass authority and signal importance. A page with many incoming links is easier to crawl and typically ranks better than an equivalent page with few or none.',
      },
      {
        question: 'How many pages can it analyze?',
        answer: 'You set the limit before each run; the default is 30 pages. The crawl follows internal links from the start URL and stops when it hits your limit or runs out of links.',
      },
      {
        question: 'Is anything from my crawl stored?',
        answer: 'No. The Exyconn server builds the structure in memory and returns it to your browser. Neither the URL nor the crawl results are saved.',
      },
      {
        question: 'Does it analyze external links too?',
        answer: 'No. The analyzer is focused on site architecture, so it only follows and counts internal links within the domain you enter.',
      },
    ],
    keywords: [
      'site structure analyzer',
      'internal linking tool free',
      'website hierarchy checker',
      'click depth checker',
      'orphan page finder',
      'internal link audit',
      'site architecture seo tool',
      'crawl depth analysis',
    ],
    metaDescription:
      'Free site structure analyzer — crawl your website to map click depth, internal links and orphan pages, then export the full hierarchy as JSON.',
  },
};
