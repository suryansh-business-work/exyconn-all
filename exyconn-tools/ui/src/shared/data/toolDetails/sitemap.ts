import type { ToolDetailsMap } from './types';

/** Detail content for the "sitemap" tool category. Keyed by tool id from toolsData. */
export const sitemapToolDetails: ToolDetailsMap = {
  'sitemap-finder': {
    longDescription: [
      'Sitemap Finder Pro discovers every sitemap a website exposes, including ones that are not linked anywhere on the site. Enter a domain and the tool reads robots.txt for Sitemap: directives, probes common locations such as /sitemap.xml, /sitemap_index.xml, and /sitemap.txt, and walks any sitemap index it finds down to the child sitemaps, reporting each file\'s type, URL count, size, and last-modified date.',
      'Browsers block cross-origin requests to other domains, so the scan runs through the Exyconn server: it fetches only the public URLs involved, returns the results, and stores nothing. Three options control the scan — parse robots.txt, check common paths, and a maximum index depth — letting you run a quick check on a small site or a deeper traversal of a large sitemap index from the same form.',
      'Results include summary stats (sitemaps found, combined URL count, whether robots.txt exists, scan time) plus the full list of locations that were checked, so negative results are visible too. Found sitemaps can be exported as JSON, CSV, or TXT. It is built for SEO consultants auditing client sites, developers verifying deployments, and anyone who needs a URL inventory of a site fast.',
    ],
    features: [
      'Reads Sitemap: directives from robots.txt automatically',
      'Probes common paths like /sitemap.xml, /sitemap_index.xml, and /sitemap.txt',
      'Traverses sitemap index files to a configurable depth',
      'Shows type, URL count, size, and last-modified for every sitemap found',
      'Marks invalid or unreachable sitemaps with the exact error message',
      'Lists every location checked, including the ones with no sitemap',
      'Exports the results to JSON, CSV, or TXT',
    ],
    useCases: [
      'Audit a new SEO client\'s site to see exactly which sitemaps search engines can discover',
      'Verify that a migration or CMS switch left all sitemaps reachable and referenced in robots.txt',
      'Find a competitor\'s sitemap before pulling its URLs into a content-gap analysis',
      'Seed a crawler or scraper with every sitemap a domain publishes',
      'Get a quick total URL count for a site without opening each sitemap by hand',
    ],
    howTo: [
      'Enter the website URL — the bare domain is enough, no need to guess the sitemap path',
      'Toggle robots.txt parsing and common-path checks, and set the index traversal depth',
      'Click the find button and let the server scan the site',
      'Review each discovered sitemap\'s type, URL count, validity, and last-modified date',
      'Export the sitemap list as JSON, CSV, or TXT if you need it in another tool',
    ],
    faqs: [
      {
        question: 'Can it find sitemaps that are not listed in robots.txt?',
        answer:
          'Yes. Besides parsing robots.txt it probes a list of common filenames such as /sitemap.xml, /sitemap_index.xml, and /sitemap.txt, so unlinked sitemaps at standard paths are found as well.',
      },
      {
        question: 'Why does the scan go through a server instead of running in my browser?',
        answer:
          'Cross-origin rules prevent a web page from fetching robots.txt or XML files on another domain. The Exyconn server does the fetching and returns the report; the URLs are fetched live and nothing is stored.',
      },
      {
        question: 'What does the max depth setting control?',
        answer:
          'Large sites use sitemap index files that point to child sitemaps, and indexes can nest. Max depth limits how many index levels the finder follows before it stops.',
      },
      {
        question: 'Will it find a sitemap at a completely custom path?',
        answer:
          'Only if robots.txt references it. A sitemap at a non-standard path with no robots.txt entry is undiscoverable for this tool — and for search engines, which is exactly the problem worth fixing.',
      },
      {
        question: 'Does it count the URLs inside each sitemap?',
        answer:
          'Yes. Every discovered sitemap is fetched and its URL entries are counted, and the summary shows the combined total across all files.',
      },
    ],
    keywords: [
      'find sitemap of a website',
      'sitemap finder online',
      'locate sitemap.xml',
      'check robots.txt for sitemap',
      'discover hidden sitemaps',
      'sitemap checker',
      'how to find a sitemap url',
      'website sitemap lookup',
    ],
    metaDescription:
      'Free sitemap finder: discover every XML sitemap on any website via robots.txt, common paths, and index traversal — with URL counts and JSON/CSV export.',
  },
  'sitemap-validator': {
    longDescription: [
      'The XML Sitemap Validator fetches any public sitemap and checks it against the sitemaps.org protocol that Google and Bing implement. It verifies the XML parses, that the root element is <urlset>, that every entry has a <loc> containing a well-formed absolute URL, that lastmod values use the W3C date format, that changefreq is one of the seven allowed values, and that priority sits between 0.0 and 1.0.',
      'It also enforces the two hard protocol limits that most often break generated sitemaps silently: a maximum of 50,000 URLs per file and 50MB uncompressed size. Findings are split into errors, which can make search engines reject the file, and warnings for legal-but-sloppy values, each tied to the specific URL where the problem occurs. Pointing it at a sitemap index is detected and flagged rather than misreported.',
      'Paste a sitemap URL and click validate: the summary shows pass or fail, total URL count, and file size, while the issues panel lists every error and warning. The fetch and parse run on the Exyconn server because browsers cannot request XML from other domains; the file is processed in memory and never stored. It is a ten-second sanity check before submitting a sitemap to Google Search Console.',
    ],
    features: [
      'Checks XML syntax and the required <urlset> structure',
      'Validates every <loc> as a well-formed absolute URL',
      'Verifies lastmod W3C date format, changefreq values, and 0.0-1.0 priority range',
      'Enforces the 50,000-URL and 50MB sitemap protocol limits',
      'Separates blocking errors from advisory warnings',
      'Ties each issue to the exact URL that caused it',
      'Reports total URL count and file size',
    ],
    useCases: [
      'Validate a generated sitemap before submitting it to Google Search Console or Bing Webmaster Tools',
      'Debug why Search Console reports "Couldn\'t fetch" or parsing errors for your sitemap',
      'Confirm a CMS plugin or custom generator still produces valid XML after an upgrade',
      'Add a pre-release check for large sites whose sitemaps are built in CI',
    ],
    howTo: [
      'Paste the full sitemap URL, for example https://example.com/sitemap.xml',
      'Click Validate and wait while the file is fetched and parsed',
      'Check the summary panel for pass/fail status, URL count, and file size',
      'Fix the listed errors first — they can stop search engines from reading the file — then the warnings',
      'Re-run the validation until the sitemap passes clean',
    ],
    faqs: [
      {
        question: 'What is the difference between an error and a warning?',
        answer:
          'Errors are protocol violations that can make search engines reject or truncate the sitemap, such as broken XML or an invalid URL in <loc>. Warnings are values that parse but are wrong or unhelpful, like a malformed lastmod date or a changefreq outside the allowed set.',
      },
      {
        question: 'What limits does a sitemap file have?',
        answer:
          'The sitemaps.org protocol caps a single file at 50,000 URLs and 50MB uncompressed. Bigger sites must split into multiple sitemaps referenced by a sitemap index — the validator flags files that exceed either limit.',
      },
      {
        question: 'Can I validate a sitemap index file?',
        answer:
          'The validator targets regular <urlset> sitemaps. If you point it at a sitemap index it detects that and tells you, so validate the child sitemaps individually.',
      },
      {
        question: 'Is my sitemap stored after validation?',
        answer:
          'No. The Exyconn server fetches the URL, validates the XML in memory, returns the report, and discards the content.',
      },
      {
        question: 'Which changefreq values are valid?',
        answer:
          'Exactly seven: always, hourly, daily, weekly, monthly, yearly, and never. Anything else is flagged as a warning.',
      },
    ],
    keywords: [
      'xml sitemap validator',
      'validate sitemap online',
      'sitemap checker free',
      'sitemap error checker',
      'test sitemap.xml',
      'sitemap 50000 url limit',
      'google sitemap validation',
      'sitemap lastmod format',
    ],
    metaDescription:
      'Validate any XML sitemap free: syntax, URL format, lastmod, changefreq, priority, and the 50,000-URL/50MB limits — with clear errors and warnings.',
  },
  'sitemap-generator': {
    longDescription: [
      'Sitemap Generator Online builds a standards-compliant sitemap.xml from a list of URLs, entirely in your browser — nothing you type is uploaded anywhere. Add pages one at a time with their own changefreq and priority, or paste a whole list into the bulk box (one URL per line) and let the tool apply your default settings to every line. Each entry gets a lastmod stamped with today\'s date.',
      'The output is a proper sitemaps.org <urlset> document: XML declaration, the 0.9 namespace, and a <url> block with <loc>, <lastmod>, <changefreq>, and <priority> for every page. Copy it to the clipboard or download it as sitemap.xml, upload the file to your site root, and reference it from robots.txt or submit it in Search Console — no build pipeline or plugin required.',
      'It suits small and mid-size sites with no CMS generating sitemaps for them — landing pages, static sites, hand-written HTML, or a quick sitemap for a staging build. Because generation happens instantly in the page, you can tweak changefreq and priority values and regenerate as many times as you like without waiting on a server or hitting a quota.',
    ],
    features: [
      'Runs 100% client-side — your URL list never leaves the browser',
      'Bulk input: paste one URL per line and convert the whole list at once',
      'Per-URL changefreq and priority, with configurable defaults for bulk adds',
      'Stamps each entry with a current lastmod date',
      'Outputs valid sitemaps.org XML with the 0.9 namespace',
      'One-click copy to clipboard or download as sitemap.xml',
    ],
    useCases: [
      'Create a sitemap for a static or hand-coded site that has no CMS to generate one',
      'Build a small sitemap for a landing-page campaign so it gets indexed quickly',
      'Produce a fresh sitemap after restructuring URLs, before resubmitting to Search Console',
      'Generate a throwaway sitemap for a staging environment to test crawl behavior',
    ],
    howTo: [
      'Set the default change frequency and priority you want applied to new URLs',
      'Paste your URLs into the bulk input (one per line) and add them, or add entries one by one',
      'Adjust changefreq or priority on individual URLs where they differ from the default',
      'Click Generate Sitemap to build the XML instantly in your browser',
      'Copy the result or download sitemap.xml and upload it to your site\'s root directory',
    ],
    faqs: [
      {
        question: 'Are my URLs uploaded to a server?',
        answer:
          'No. The sitemap is assembled entirely in your browser with JavaScript; the URL list never leaves your machine.',
      },
      {
        question: 'How many URLs can one sitemap hold?',
        answer:
          'The sitemap protocol allows up to 50,000 URLs and 50MB per file. If you have more, generate multiple sitemaps and tie them together with the Sitemap Index Generator.',
      },
      {
        question: 'What do changefreq and priority actually do?',
        answer:
          'They are hints, not commands: changefreq suggests how often a page changes and priority (0.0-1.0) suggests relative importance within your own site. Google largely ignores both today, but they remain valid protocol fields and other crawlers may use them.',
      },
      {
        question: 'Where do I put the finished sitemap.xml?',
        answer:
          'Upload it to the root of your site (https://example.com/sitemap.xml), add a Sitemap: line pointing at it in robots.txt, and submit it in Google Search Console and Bing Webmaster Tools.',
      },
      {
        question: 'What lastmod value does the tool write?',
        answer:
          'Each generated entry uses today\'s date in YYYY-MM-DD format. If specific pages need different dates, edit the XML after downloading.',
      },
    ],
    keywords: [
      'xml sitemap generator',
      'sitemap generator online free',
      'create sitemap.xml',
      'generate sitemap from url list',
      'bulk url to sitemap',
      'sitemap maker',
      'sitemap builder for static site',
      'sitemap changefreq priority',
    ],
    metaDescription:
      'Generate an XML sitemap free, right in your browser: paste URLs in bulk, set changefreq and priority, then copy or download a valid sitemap.xml.',
  },
  'sitemap-url-extractor': {
    longDescription: [
      'Sitemap URL Extractor pulls every URL out of a sitemap.xml so you can actually work with the list. Paste a sitemap address and the tool fetches it, parses each <url> entry, and shows the results in a table with the loc, lastmod, changefreq, and priority for every row. Point it at a sitemap index and it follows the child sitemaps automatically (up to ten per index) and merges their URLs into one list.',
      'The table has a live search filter, so extracting "every blog post" or "all URLs containing /products/" is a matter of typing the substring. From there, copy the filtered URLs to the clipboard as a plain newline-separated list, or export the visible rows — URL, last modified, change frequency, priority — as a CSV file ready for a spreadsheet or crawler.',
      'The fetch runs on the Exyconn server because browsers cannot read XML from other domains; nothing is retained after the response. Typical users: SEO teams feeding URL lists into Screaming Frog or a rank tracker, developers building redirect maps for a migration, and content teams inventorying what a site actually publishes.',
    ],
    features: [
      'Extracts loc, lastmod, changefreq, and priority for every URL',
      'Follows sitemap indexes automatically and merges child sitemap URLs',
      'Live search filter over the extracted list',
      'Copies all (or filtered) URLs as a plain text list',
      'Exports full rows to CSV',
      'Summary panel with total URL count and sitemap type',
    ],
    useCases: [
      'Feed a full URL list into Screaming Frog, a rank tracker, or a load-testing script',
      'Build a redirect map for a site migration from the old site\'s sitemap',
      'Inventory every published page on your own site to find stale content',
      'Pull a competitor\'s public URL list for a content-gap analysis',
      'Filter a huge sitemap down to one section, like /blog/ or /products/',
    ],
    howTo: [
      'Paste the sitemap or sitemap-index URL into the input field',
      'Click Extract — child sitemaps in an index are followed automatically',
      'Use the search box to filter the table down to the URLs you care about',
      'Copy the URL list to the clipboard or download everything as CSV',
    ],
    faqs: [
      {
        question: 'Does it work with sitemap index files?',
        answer:
          'Yes. When the URL points at a <sitemapindex>, the extractor fetches up to ten child sitemaps, merges their URLs into a single list, and shows which child sitemaps it found.',
      },
      {
        question: 'Is there a limit on how many URLs it can extract?',
        answer:
          'Each sitemap file can hold up to 50,000 URLs and the extractor reads them all; for indexes it processes the first ten child sitemaps, so extremely large sites may need extracting in parts.',
      },
      {
        question: 'Can I export only the URLs that match my search?',
        answer:
          'Yes — both the copy action and the CSV export use the currently filtered list, so search first and then copy or export to get just the matching URLs.',
      },
      {
        question: 'Is the sitemap I extract stored anywhere?',
        answer:
          'No. The Exyconn server fetches the public sitemap you name, parses it in memory, returns the URL list, and keeps nothing.',
      },
      {
        question: 'Why does the extraction need a server at all?',
        answer:
          'Browsers enforce cross-origin restrictions, so a page on this site cannot fetch XML from yours. The server does the fetch and hands the parsed result back.',
      },
    ],
    keywords: [
      'extract urls from sitemap',
      'sitemap url extractor',
      'sitemap to csv',
      'get all urls from a website sitemap',
      'sitemap.xml url list',
      'parse sitemap online',
      'export sitemap urls',
    ],
    metaDescription:
      'Extract every URL from any sitemap.xml free — follows sitemap indexes, shows lastmod, changefreq and priority, with search, copy-all and CSV export.',
  },
  'sitemap-compare': {
    longDescription: [
      'Sitemap Compare Tool diffs two XML sitemaps the way git diffs code. Give it two sitemap URLs — an old snapshot and the current file, staging versus production, or your site versus a competitor\'s — and it fetches both (following sitemap indexes on each side), matches entries by URL, and reports exactly which URLs were added, which were removed, and which changed their lastmod date.',
      'The summary shows the URL count of each sitemap plus added, removed, and modified counts at a glance, and the results table lists each difference with its old and new lastmod values, so you can tell genuinely new content apart from pages that were merely touched. Unchanged URLs are counted but not listed, which keeps the diff readable even on large sites.',
      'Both fetches run on the Exyconn server (cross-origin rules block direct browser access) and nothing is stored. It is most useful around migrations and releases: run it before and after a deploy to prove no URLs were dropped, or weekly against a competitor to watch what they publish and prune — no exporting or spreadsheet wrangling needed.',
    ],
    features: [
      'Diffs two sitemaps into added, removed, and modified URL sets',
      'Detects lastmod changes and shows old versus new dates',
      'Follows sitemap indexes on both sides before comparing',
      'Summary counts for both sitemaps and every change type',
      'Counts unchanged URLs without cluttering the results table',
    ],
    useCases: [
      'Verify a site migration or redesign dropped no URLs by comparing pre- and post-deploy sitemaps',
      'Monitor a competitor\'s sitemap weekly to see what content they add and remove',
      'Compare staging and production sitemaps before a release',
      'Find out which pages a CMS update silently removed from the sitemap',
      'Track how many pages actually changed (lastmod) after a bulk content update',
    ],
    howTo: [
      'Paste the first sitemap URL (the "before" or baseline version)',
      'Paste the second sitemap URL (the "after" or comparison version)',
      'Click Compare and let the server fetch and diff both files',
      'Review added, removed, and modified URLs in the results table, with lastmod changes side by side',
    ],
    faqs: [
      {
        question: 'What counts as a "modified" URL?',
        answer:
          'A URL present in both sitemaps whose lastmod value differs. The table shows the old and new dates so you can judge whether the change matters.',
      },
      {
        question: 'Can I compare sitemaps from two different websites?',
        answer:
          'Yes — the tool just matches URL strings, so comparing your sitemap against a competitor\'s works fine; expect almost everything to land in added and removed.',
      },
      {
        question: 'Does it handle sitemap index files?',
        answer:
          'Yes. Each side is expanded through its sitemap index (up to ten child sitemaps per index) before the diff runs.',
      },
      {
        question: 'How do I compare today\'s sitemap with last month\'s?',
        answer:
          'Sitemaps are compared live, so both versions must be reachable at a URL. Keep dated copies (for example sitemap-2026-08.xml) on your server or a storage bucket and compare those snapshots.',
      },
      {
        question: 'Are the sitemaps stored after the comparison?',
        answer:
          'No. Both files are fetched by the Exyconn server, diffed in memory, and discarded once the result is returned.',
      },
    ],
    keywords: [
      'compare two sitemaps',
      'sitemap diff tool',
      'sitemap comparison online',
      'find removed urls sitemap',
      'sitemap changes tracker',
      'compare sitemap before after migration',
      'sitemap added removed urls',
    ],
    metaDescription:
      'Compare two XML sitemaps free: see added, removed and modified URLs with lastmod changes, plus summary counts — ideal for migrations and SEO audits.',
  },
  'sitemap-split-merge': {
    longDescription: [
      'Sitemap Split & Merge takes a sitemap that has grown past the protocol limits and turns it into a set of compliant parts. Paste the sitemap URL, choose how many URLs each part should hold (1,000 to 50,000 via the slider), and the tool fetches the file — expanding any sitemap index it meets — and chunks the URLs into numbered sitemap files, each a complete, valid <urlset> document.',
      'Alongside the parts it generates the matching sitemap-index.xml that merges them back into a single entry point for search engines: one <sitemap> entry per generated file, ready to upload and reference from robots.txt. Download files individually, grab every part plus the index with one click, or copy any file\'s XML straight from the preview panel.',
      'The split runs on the Exyconn server, which fetches the public sitemap you name and stores nothing. It is the fastest fix when Search Console rejects a sitemap for exceeding 50,000 URLs or 50MB, and equally useful when you simply want smaller sitemaps that are easier to debug and faster for crawlers to re-fetch after partial site updates.',
    ],
    features: [
      'Splits any sitemap into parts of 1,000 to 50,000 URLs each',
      'Expands sitemap indexes before splitting, so nested setups work',
      'Every part is a complete, valid sitemaps.org <urlset> file',
      'Generates the sitemap-index.xml that ties the parts together',
      'Preserves lastmod, changefreq, and priority from the source entries',
      'Per-file download, download-all, and copy-to-clipboard',
    ],
    useCases: [
      'Fix a Search Console rejection for a sitemap over 50,000 URLs or 50MB',
      'Break a monolithic sitemap into smaller files that crawlers re-fetch faster',
      'Prepare an e-commerce catalog sitemap for a platform that caps file size',
      'Restructure one giant sitemap into parts plus an index before the site grows further',
    ],
    howTo: [
      'Paste the URL of the sitemap you want to split',
      'Set the URLs-per-file limit with the slider (1K to 50K)',
      'Click Split Sitemap and wait for the server to fetch and chunk the file',
      'Download individual parts, or use Download All to get every part plus sitemap-index.xml',
      'Upload the parts and the index to your site and reference the index from robots.txt',
    ],
    faqs: [
      {
        question: 'Why would I split a sitemap?',
        answer:
          'The sitemap protocol caps each file at 50,000 URLs and 50MB uncompressed. Files over the limit can be rejected outright, and even legal-but-huge sitemaps are slow for crawlers to re-fetch when only part of your site changed.',
      },
      {
        question: 'Where does the "merge" part come in?',
        answer:
          'The generated sitemap-index.xml merges the parts back into one entry point: search engines fetch the index, then each part. You submit only the index URL to Search Console.',
      },
      {
        question: 'Do the split files keep lastmod, changefreq, and priority?',
        answer:
          'Yes — each URL entry carries its original metadata into whichever part it lands in.',
      },
      {
        question: 'What do I do with the downloaded files?',
        answer:
          'Upload every sitemap part and the sitemap-index.xml to your site (typically the root), then reference the index in robots.txt and submit it to search engines. Adjust the <loc> values in the index if your files live at a different path.',
      },
      {
        question: 'Is my sitemap stored on the server?',
        answer:
          'No. The Exyconn server fetches the sitemap URL you supply, performs the split in memory, and returns the generated files without keeping anything.',
      },
    ],
    keywords: [
      'split large sitemap',
      'sitemap splitter online',
      'sitemap 50000 url limit fix',
      'break sitemap into multiple files',
      'sitemap index from split',
      'merge sitemaps into index',
      'sitemap too large search console',
    ],
    metaDescription:
      'Split oversized XML sitemaps free: pick 1,000-50,000 URLs per file and get numbered sitemap parts plus a ready-made sitemap index tying them together.',
  },
  'sitemap-insights': {
    longDescription: [
      'Sitemap Insights Tool turns a raw sitemap into a structural report of the site behind it. Paste a sitemap URL and the analyzer fetches it (expanding sitemap indexes), then breaks the URL set down along seven axes: top path patterns by first URL segment, folder depth distribution, domain and subdomain breakdown, file-type extensions, lastmod freshness buckets, changefreq distribution, and priority ranges.',
      'The freshness buckets are the quickest win: URLs are grouped into last 7 days, last 30 days, last 90 days, last year, and older, which instantly shows whether a site is actively maintained or coasting on stale lastmod values. Pattern and depth cards reveal how content is distributed — how much of the site is /blog/ versus /products/, and how deeply the architecture nests.',
      'Analysis runs on the Exyconn server (browsers cannot fetch cross-origin XML) and nothing is retained; only aggregated statistics come back. Each dimension renders as its own card, so the whole report scans in seconds. Use it to profile a competitor\'s content strategy from the outside, sanity-check your own information architecture, or scope a prospective client\'s site before an audit.',
    ],
    features: [
      'Top URL patterns by first path segment, with counts and percentages',
      'Folder depth distribution across the whole URL set',
      'Domain and subdomain breakdown for multi-host sitemaps',
      'File-type analysis from URL extensions',
      'Lastmod freshness buckets from "last 7 days" to "older than 1 year"',
      'Changefreq and priority distributions',
      'Follows sitemap indexes automatically before analyzing',
    ],
    useCases: [
      'Profile a competitor\'s content mix — how much of their site is blog, product, or category pages',
      'Check whether lastmod dates show a site is actively updated or stagnant',
      'Audit site architecture depth before an SEO restructure',
      'Spot unexpected subdomains or foreign domains inside a sitemap',
      'Scope the size and shape of a prospective client\'s site in one pass',
    ],
    howTo: [
      'Paste the sitemap URL into the field at the top',
      'Click Analyze and wait a few seconds while the server fetches and processes the URLs',
      'Read the insight cards: patterns, depth, domains, file types, freshness, changefreq, and priority',
      'Drill into the standout numbers — a huge "older than 1 year" bucket or a lopsided pattern is where the SEO work is',
    ],
    faqs: [
      {
        question: 'What does the URL pattern analysis show?',
        answer:
          'URLs are grouped by their first path segment (for example /blog/ or /products/), giving a count and percentage per section — effectively a content-mix chart of the site.',
      },
      {
        question: 'How is freshness calculated?',
        answer:
          'From each URL\'s lastmod date, bucketed into last 7 days, last 30 days, last 90 days, last year, and older than 1 year. URLs without lastmod simply do not appear in the freshness card.',
      },
      {
        question: 'Does it work on sitemap index files?',
        answer:
          'Yes. Indexes are expanded (up to ten child sitemaps) and the combined URL set is analyzed as one.',
      },
      {
        question: 'Can I analyze a site I do not own?',
        answer:
          'Yes — any publicly reachable sitemap works, which is exactly what makes it useful for competitor research.',
      },
      {
        question: 'Is the analyzed sitemap stored?',
        answer:
          'No. The Exyconn server fetches it, computes the statistics in memory, and returns only the aggregated numbers.',
      },
    ],
    keywords: [
      'sitemap analyzer',
      'analyze sitemap structure',
      'sitemap insights online',
      'sitemap url pattern analysis',
      'competitor sitemap analysis',
      'sitemap lastmod freshness',
      'site architecture depth analysis',
    ],
    metaDescription:
      'Free sitemap analyzer: break any sitemap into URL patterns, folder depth, domains, file types, lastmod freshness, changefreq and priority in one report.',
  },
  'sitemap-index-generator': {
    longDescription: [
      'Sitemap Index Generator builds the sitemap-index.xml that ties multiple sitemaps into a single file search engines can start from. Add the URL of each sitemap along with its last-modified date, click generate, and the tool produces a valid <sitemapindex> document with the sitemaps.org 0.9 namespace — the exact format Google expects once a site outgrows a single sitemap file.',
      'Everything happens client-side in your browser: the XML is assembled with JavaScript as you click, no data is uploaded, and there is nothing to wait for. Each entry defaults its lastmod to today and is editable with a date field per row, and rows can be added or removed freely before generating. The output panel offers one-click copy and a sitemap-index.xml download.',
      'You need an index whenever a site has multiple sitemaps — a posts sitemap, a pages sitemap, a products sitemap — or when a single file passed the 50,000-URL limit and had to be split. Submit the index URL once in Search Console and reference it from robots.txt; search engines then discover every child sitemap through it automatically.',
    ],
    features: [
      'Generates valid <sitemapindex> XML with the sitemaps.org 0.9 namespace',
      'Runs entirely in the browser — no upload, no server round-trip',
      'Per-sitemap lastmod date fields, defaulting to today',
      'Add and remove sitemap rows freely before generating',
      'Copy the XML or download it as sitemap-index.xml',
    ],
    useCases: [
      'Combine separate posts, pages, and products sitemaps under one submittable index',
      'Create the index file after splitting an oversized sitemap into parts',
      'Consolidate sitemaps from multiple site sections so only one URL goes in robots.txt',
      'Rebuild a lost or broken sitemap index without touching the child sitemaps',
    ],
    howTo: [
      'Add a row for each sitemap and paste its full URL, e.g. https://example.com/sitemap-posts.xml',
      'Set each sitemap\'s last-modified date, or keep the default of today',
      'Click Generate Sitemap Index to build the XML instantly',
      'Copy the output or download sitemap-index.xml',
      'Upload it to your site root, reference it in robots.txt, and submit it in Search Console',
    ],
    faqs: [
      {
        question: 'What is a sitemap index?',
        answer:
          'An XML file whose entries point at other sitemap files instead of pages. Search engines fetch the index first, then each listed sitemap, so one submission covers the whole site.',
      },
      {
        question: 'When do I need one?',
        answer:
          'When you have more than one sitemap — either because a file hit the 50,000-URL/50MB limit and was split, or because you maintain separate sitemaps per content type.',
      },
      {
        question: 'Do my sitemap URLs get uploaded anywhere?',
        answer:
          'No. The index is generated entirely in your browser; nothing you enter leaves your machine.',
      },
      {
        question: 'Can an index reference sitemaps on a different domain?',
        answer:
          'The protocol expects listed sitemaps to live on the same host as the index. Cross-host references are generally ignored unless the hosts are verified together in Search Console.',
      },
      {
        question: 'How many sitemaps can one index list?',
        answer:
          'Up to 50,000 sitemap entries and 50MB per index file — enough for 2.5 billion URLs. Note that Google does not support nesting one index inside another.',
      },
    ],
    keywords: [
      'sitemap index generator',
      'create sitemap index file',
      'sitemapindex xml',
      'combine multiple sitemaps',
      'sitemap index example',
      'submit multiple sitemaps google',
      'sitemap-index.xml generator',
    ],
    metaDescription:
      'Build a sitemap index file free, entirely in your browser: list your sitemap URLs, set lastmod dates, and download a valid sitemap-index.xml.',
  },
  'robots-sitemap-generator': {
    longDescription: [
      'Robots.txt Sitemap Generator assembles a complete robots.txt — crawler access rules plus Sitemap: directives — through a form instead of hand-editing a file where a single typo can deindex a site. Add one or more sitemap URLs, define user-agent blocks each with their own Allow and Disallow paths, and optionally set a crawl-delay from 0 to 30 seconds with a slider.',
      'The file is built entirely in your browser as plain text in the order crawlers expect: each user-agent block with its Disallow and Allow lines (plus crawl-delay when set), then the Sitemap: lines at the end. Nothing you configure is uploaded. Copy the result or download robots.txt, drop it at your site root, and every crawler that honors robots.txt finds your sitemaps on its next visit.',
      'Listing sitemaps in robots.txt matters because it is the one location every search engine checks without being told — including engines you never submitted to. The tool suits developers standing up new sites, SEOs fixing crawl issues, and anyone who wants specific bots throttled or sections like /admin/ kept out of crawling.',
    ],
    features: [
      'Multiple Sitemap: directives in one robots.txt',
      'Per-user-agent rule blocks with separate Allow and Disallow path lists',
      'Crawl-delay slider from 0 to 30 seconds',
      'Generates the file client-side — nothing is uploaded',
      'Standard ordering: rule blocks first, sitemap lines last',
      'Copy to clipboard or download as robots.txt',
    ],
    useCases: [
      'Create robots.txt for a brand-new site with the sitemap referenced from day one',
      'Block crawlers from /admin/, /cart/, or staging paths while keeping the rest open',
      'Give a specific bot its own rules — for example, throttling an aggressive scraper with crawl-delay',
      'Add missing Sitemap: lines to a site whose sitemaps search engines cannot find',
      'Rebuild a robots.txt that was overwritten during a deploy',
    ],
    howTo: [
      'Enter the full URL of each sitemap you want crawlers to discover',
      'Add user-agent blocks and fill in their Allow and Disallow paths (* targets all bots)',
      'Set a crawl-delay with the slider if you need to slow crawlers down',
      'Click Generate robots.txt and review the output',
      'Copy or download the file and upload it to your site root as /robots.txt',
    ],
    faqs: [
      {
        question: 'Why put sitemap URLs in robots.txt?',
        answer:
          'Robots.txt is the one file every crawler checks automatically, so a Sitemap: line lets any search engine discover your sitemap without you submitting it anywhere. It complements, not replaces, Search Console submission.',
      },
      {
        question: 'What is the difference between Allow and Disallow?',
        answer:
          'Disallow blocks crawling of matching paths; Allow re-opens a subpath inside a disallowed area (for example, Disallow /private/ but Allow /private/press/). With no Disallow rules, everything is crawlable by default.',
      },
      {
        question: 'Does Google respect crawl-delay?',
        answer:
          'No — Google ignores the crawl-delay directive (its crawl rate is managed automatically). Bing, Yandex, and several other crawlers do honor it.',
      },
      {
        question: 'Does Disallow keep a page out of Google results?',
        answer:
          'Not reliably. Disallow stops crawling, but a URL can still be indexed from external links. To keep a page out of results, use a noindex robots meta tag and let the page be crawled.',
      },
      {
        question: 'Is anything I enter sent to a server?',
        answer:
          'No. The robots.txt is generated in your browser and only exists on your machine until you upload it to your site.',
      },
    ],
    keywords: [
      'robots.txt generator',
      'robots.txt with sitemap',
      'add sitemap to robots.txt',
      'create robots.txt online free',
      'user-agent disallow generator',
      'crawl delay robots.txt',
      'robots txt file maker',
    ],
    metaDescription:
      'Free robots.txt generator with sitemap directives: build user-agent rules, allow/disallow paths and crawl-delay, then copy or download robots.txt.',
  },
  'sitemap-frequency-analyzer': {
    longDescription: [
      'Sitemap Frequency Analyzer audits how a sitemap uses the two optional crawl hints, changefreq and priority. Paste a sitemap URL and the tool fetches it (expanding sitemap indexes), tallies every changefreq value from always to never, buckets priorities into high (0.8-1.0), medium (0.5-0.7), and low (0.0-0.4), and renders both distributions as color-coded charts with counts and shares.',
      'Beyond the charts it produces concrete recommendations: it flags when more than half the URLs are missing changefreq or priority, and annotates each frequency with when it is appropriate — hourly for news, weekly for product pages, yearly for legal boilerplate. That makes it easy to spot the classic mistake of shipping every page with priority 1.0 and changefreq daily.',
      'The analysis runs on the Exyconn server (cross-origin rules block direct browser fetches) and nothing is stored; the full result can be copied or downloaded as JSON for reports. It is aimed at SEOs auditing crawl-hint hygiene, and at developers checking what their sitemap generator actually emits versus what they thought they configured.',
    ],
    features: [
      'Counts every changefreq value from always to never, with percentages',
      'Buckets priority values into high, medium, and low ranges',
      'Color-coded distribution charts for both dimensions',
      'Flags sitemaps where most URLs lack changefreq or priority',
      'Per-frequency guidance on when each value is appropriate',
      'Copy or download the full analysis as JSON',
    ],
    useCases: [
      'Audit whether a sitemap generator sets sensible changefreq and priority values',
      'Find sites that mark every page priority 1.0, which tells crawlers nothing',
      'Check a competitor\'s crawl hints to see how they stage content importance',
      'Attach a JSON crawl-hint report to an SEO audit deliverable',
    ],
    howTo: [
      'Paste the sitemap URL and click Analyze',
      'Read the changefreq chart: each value shows its URL count and share of the sitemap',
      'Read the priority chart to see how importance is distributed across the site',
      'Apply the recommendations, regenerate your sitemap, and re-run to confirm',
    ],
    faqs: [
      {
        question: 'Do changefreq and priority still matter for Google?',
        answer:
          'Google has said it largely ignores both, relying on observed change patterns instead. They remain part of the protocol, other crawlers may read them, and wildly wrong values still signal a misconfigured generator worth fixing.',
      },
      {
        question: 'What does a good priority distribution look like?',
        answer:
          'A spread: a few high-priority pages (home, key categories), most content in the middle, utility pages low. If everything is 1.0 the field carries no information at all.',
      },
      {
        question: 'What if my sitemap has no changefreq or priority at all?',
        answer:
          'That is valid — both tags are optional — and the tool reports the missing counts rather than failing. The recommendations flag it when most URLs lack them, but adding them is a judgment call.',
      },
      {
        question: 'Does it work with sitemap indexes?',
        answer:
          'Yes. Child sitemaps are fetched (up to ten per index) and analyzed together as one URL set.',
      },
      {
        question: 'Is the sitemap stored after analysis?',
        answer:
          'No. The Exyconn server fetches it, computes the distributions in memory, and returns only the aggregate statistics.',
      },
    ],
    keywords: [
      'sitemap changefreq analyzer',
      'sitemap priority analysis',
      'changefreq best practices',
      'sitemap crawl hints audit',
      'analyze sitemap frequency',
      'sitemap priority distribution',
      'changefreq values seo',
    ],
    metaDescription:
      'Analyze changefreq and priority across any sitemap free: distribution charts, missing-value checks and concrete recommendations, exportable as JSON.',
  },
};
