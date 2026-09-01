import type { ToolDetailsMap } from './types';

/** Detail content for the "seo" tool category. Keyed by tool id from toolsData. */
export const seoToolDetails: ToolDetailsMap = {
  'seo-checker': {
    longDescription: [
      'The SEO Checker audits any public web page and scores its on-page optimization out of 100. Enter a URL and the Exyconn server fetches the live page, then inspects the elements search engines actually read: the title tag, meta description, heading structure (H1–H3), image alt attributes, internal and external links, word count, and Schema.org structured data. Every problem it finds is listed in an issues table graded by severity — critical, warning, or informational.',
      'Unlike audit suites that require an account or crawl budget, this checker runs a single-page analysis on demand and returns results in seconds. The score summarizes how well the page follows on-page best practices, and the accompanying chips show word count, total links, image count, and whether schema markup was detected — so you can see at a glance where a page stands before diving into individual issues.',
      'It is built for site owners, content writers, and freelance SEOs who need a quick, repeatable health check: run it on a page before publishing, after a redesign, or on a competitor URL to compare how thoroughly their pages are optimized against yours. Because nothing is cached or stored, each run reflects the page exactly as it is served at that moment — fix an issue, re-check, and watch the score move.',
    ],
    features: [
      'On-page SEO score out of 100 with color-coded severity',
      'Issues table graded critical / warning / info',
      'Title tag and meta description length checks',
      'Heading structure analysis (H1, H2, H3 counts)',
      'Internal vs external link breakdown',
      'Image count and alt-attribute coverage',
      'Schema.org structured data detection',
      'Word count and content depth measurement',
    ],
    useCases: [
      'Audit a new blog post before hitting publish',
      'Diagnose why a page dropped in rankings after a redesign',
      'Compare your product page against a competitor URL',
      'Run a quick pre-handover check on a client website',
      'Verify schema markup survived a CMS migration',
    ],
    howTo: [
      'Enter the full URL of the page you want to audit (https:// is added automatically if you omit it).',
      'Click "Check SEO" and wait a few seconds while the server fetches and analyzes the page.',
      'Review the overall score and the summary chips for words, links, images, and schema.',
      'Expand the issues table and fix the critical items first, then warnings.',
      'Re-run the check after making changes to confirm the score improved.',
    ],
    faqs: [
      {
        question: 'What does the SEO score actually measure?',
        answer: 'It measures on-page factors: title and meta description quality, heading structure, image alt text, link profile, content length, and structured data. It does not include off-page signals like backlinks from other sites.',
      },
      {
        question: 'Can I check any website, or only my own?',
        answer: 'Any publicly accessible URL works — the server simply fetches the page like a search engine crawler would. Pages behind logins or paywalls cannot be analyzed.',
      },
      {
        question: 'Does the tool store the pages I check?',
        answer: 'No. The page is fetched, analyzed in memory on the Exyconn server, and the results are returned to your browser. Nothing is saved.',
      },
      {
        question: 'Why is my score low even though my content is good?',
        answer: 'The score reflects technical on-page signals, not writing quality. Missing meta descriptions, absent H1 tags, images without alt text, or no structured data will lower it regardless of how well-written the content is.',
      },
      {
        question: 'How often should I re-check a page?',
        answer: 'Re-check after any meaningful edit, template change, or CMS update. For stable pages, a monthly check is enough to catch regressions.',
      },
    ],
    keywords: [
      'free seo checker',
      'seo analyzer online',
      'website seo audit tool',
      'on page seo checker',
      'seo score checker',
      'check website seo free',
      'meta tag analyzer',
      'seo audit online free',
    ],
    metaDescription: 'Free SEO checker: audit any page for title, meta, headings, links, images and schema. Get a 0-100 score with graded issues in seconds.',
  },

  'serp-checker': {
    longDescription: [
      'The SERP Checker maps the search landscape around any keyword by pulling the real related search queries Google associates with it. Type a keyword and the tool queries Google Autocomplete through the Exyconn server, returning the actual phrases people type into the search box — ranked in a table with word and character counts so you can spot short-tail and long-tail variations at a glance.',
      'Understanding what surrounds a keyword on the results page is half of SERP analysis: the related queries reveal searcher intent, question formats, and modifier patterns (best, near me, vs, how to) that shape which pages Google rewards. The first results are highlighted so you can prioritize the variations with the strongest association to your seed term, and a one-click copy button exports the whole list for your content brief.',
      'It suits content strategists and SEO freelancers doing SERP research without a paid suite: no login, no quota to manage, and the data comes straight from Google rather than a stale keyword database. Run it before drafting an outline to make sure your page covers the queries Google itself considers adjacent — the same relationships that power the "related searches" block at the bottom of the results page.',
    ],
    features: [
      'Real related search queries from Google Autocomplete',
      'Results ranked with top positions highlighted',
      'Word and character count for every query',
      'One-click copy of the full query list',
      'Instant results — no signup or API key needed',
      'Works for any language or niche keyword',
    ],
    useCases: [
      'Scope the search landscape before writing a pillar page',
      'Find question-style queries to build an FAQ section',
      'Discover modifier patterns (best, cheap, near me) around a product term',
      'Build a list of secondary keywords for an existing article',
    ],
    howTo: [
      'Enter the keyword you want to analyze, e.g. "best seo tools".',
      'Click "Analyze SERP" or press Enter.',
      'Scan the related search queries table — the top entries are the most closely associated.',
      'Use the word and length columns to separate short-tail from long-tail variations.',
      'Click "Copy" to export the full list into your content brief or spreadsheet.',
    ],
    faqs: [
      {
        question: 'Does this show the actual ranking pages for a keyword?',
        answer: 'No. Live Google result listings require the Google Custom Search API. This tool shows the real related search queries from Google Autocomplete, which reveal the intent and topic landscape around your keyword.',
      },
      {
        question: 'Where does the data come from?',
        answer: 'Directly from Google Autocomplete via the Exyconn server, so the queries reflect what people are actually typing into Google right now — not a cached keyword database.',
      },
      {
        question: 'Can I check keywords in languages other than English?',
        answer: 'Yes. Autocomplete responds in the language of the keyword you enter, so any language Google supports will return relevant related queries.',
      },
      {
        question: 'Is there a limit on how many keywords I can check?',
        answer: 'No account or quota is enforced — run as many single-keyword lookups as you need.',
      },
    ],
    keywords: [
      'serp checker free',
      'google serp analysis',
      'related searches tool',
      'serp analysis tool online',
      'google autocomplete keywords',
      'search results checker',
      'keyword serp landscape',
    ],
    metaDescription: 'Free SERP checker: pull real related search queries from Google for any keyword, spot long-tail variations, and copy the list in one click.',
  },

  'serp-simulator': {
    longDescription: [
      'The SERP Simulator shows exactly how your page will look in Google search results before you publish it. Enter a page title, meta description, and URL, and the tool renders a pixel-faithful Google snippet preview — blue title link, green display URL, gray description — updating live as you type, with running character counters against the 60-character title and 160-character description limits.',
      'Beyond the visual preview, clicking "Preview SERP" sends your snippet to the Exyconn server for analysis: you get a 0–100 score, exact length measurements for both fields, and a list of specific issues such as a title that will be truncated or a description too short to fill the snippet. Because Google cuts off overlong titles with an ellipsis, catching truncation before publishing directly protects your click-through rate.',
      'It is a staple tool for anyone who writes meta tags: content editors polishing snippets for a batch of articles, developers filling in CMS SEO fields, and agencies previewing client pages before a launch. Since the preview works entirely from the text you type, you can perfect snippets for pages that are not live yet and paste the final title and description straight into your CMS.',
    ],
    features: [
      'Pixel-faithful Google search snippet preview',
      'Live character counters for title (60) and description (160)',
      'Truncation detection with ellipsis preview',
      'Snippet score out of 100 with specific issues listed',
      'Separate length analysis for title and description',
      'No signup — preview as many snippets as you like',
    ],
    useCases: [
      'Write a title tag that will not get cut off in results',
      'Trim a meta description to fit the 160-character snippet',
      'Preview a landing page snippet before a product launch',
      'Standardize snippet quality across a batch of blog posts',
    ],
    howTo: [
      'Type your page title — the counter shows how close you are to the 60-character limit.',
      'Add your meta description and watch the 160-character counter.',
      'Enter the page URL to complete the preview.',
      'Check the live Google-style preview on the right for truncation.',
      'Click "Preview SERP" to get a score and a list of specific issues to fix.',
    ],
    faqs: [
      {
        question: 'Why do title and description length matter?',
        answer: 'Google truncates titles beyond roughly 60 characters and descriptions beyond roughly 160, replacing the overflow with an ellipsis. A cut-off snippet loses information and usually earns fewer clicks.',
      },
      {
        question: 'Will Google always use my meta description?',
        answer: 'Not always — Google sometimes rewrites snippets to better match a query. But a well-written description within the limit is used far more often than a poor or missing one.',
      },
      {
        question: 'What does the score represent?',
        answer: 'It reflects how well your title, description, and URL follow snippet best practices: correct lengths, no truncation, and both fields present. Fixing the listed issues raises the score.',
      },
      {
        question: 'Can I preview a page that is not live yet?',
        answer: 'Yes. The simulator works entirely from the text you type — the URL is only used for the display line, so unpublished pages work fine.',
      },
    ],
    keywords: [
      'serp simulator free',
      'google snippet preview',
      'meta title length checker',
      'meta description preview tool',
      'serp preview tool',
      'title tag simulator',
      'search snippet optimizer',
    ],
    metaDescription: 'Free SERP simulator: preview your Google snippet live, check title and meta description length, and fix truncation before you publish.',
  },

  'plagiarism-checker': {
    longDescription: [
      'The Plagiarism Checker analyzes your text for internal uniqueness and repetition. Paste any content of at least 10 characters and the Exyconn server computes a uniqueness score from the ratio of unique words to total words, counts sentences, measures average sentence length, and surfaces every phrase you have repeated — listed in a table with exact occurrence counts so you can see which wording appears again and again.',
      'Repetitive phrasing is one of the clearest markers of thin, templated, or machine-spun content, and search engines penalize it. The tool also grades readability (Easy, Moderate, or Complex) from sentence structure, giving writers a quick signal of whether the text is comfortable to read. Your text is analyzed in memory on the server and never stored, so drafts and client content stay private.',
      'It is designed for bloggers, students, and content teams doing a self-check before publishing or submitting: catch accidental self-repetition, verify a rewrite genuinely differs from its source structure, and tighten wordy passages before an editor sees them. Because there is no signup and no word-count paywall, it also works as a routine last step in a publishing checklist rather than an occasional audit.',
    ],
    features: [
      'Uniqueness score based on unique-to-total word ratio',
      'Repeated phrases table with exact occurrence counts',
      'Sentence count and average words per sentence',
      'Readability grade: Easy, Moderate, or Complex',
      'Live word counter while you paste or type',
      'Text is analyzed in memory and never stored',
    ],
    useCases: [
      'Self-check an article for repetitive phrasing before publishing',
      'Verify a paraphrased draft genuinely differs from the original wording',
      'Spot over-used phrases in long-form content',
      'Gauge readability of a draft before sending it to an editor',
    ],
    howTo: [
      'Paste your content into the text box (at least 10 characters).',
      'Watch the live word counter to confirm the full text was pasted.',
      'Click "Check Plagiarism" to run the analysis.',
      'Review the uniqueness score, word and sentence statistics, and the readability grade.',
      'Work through the repeated phrases table and rewrite the highest-count entries.',
    ],
    faqs: [
      {
        question: 'Does this compare my text against the whole web?',
        answer: 'No. It performs an internal uniqueness and repetition analysis of the text itself. For a web-wide duplicate search you would need a dedicated plagiarism detection API — this tool is a fast self-check for repetition and originality of phrasing.',
      },
      {
        question: 'Is my text stored anywhere?',
        answer: 'No. The text is sent to the Exyconn server, analyzed in memory, and only the statistics are returned. Nothing is saved or shared.',
      },
      {
        question: 'What is a good uniqueness score?',
        answer: '80% or higher is shown in green and indicates healthy variety. Scores below 50% suggest heavy repetition worth rewriting.',
      },
      {
        question: 'How is readability graded?',
        answer: 'From sentence structure — primarily average words per sentence. Short, direct sentences grade Easy; long, nested ones grade Complex.',
      },
      {
        question: 'Is there a length limit?',
        answer: 'The minimum is 10 characters; there is no enforced maximum, though very long documents are best checked in sections so the repeated-phrases table stays readable.',
      },
    ],
    keywords: [
      'free plagiarism checker',
      'content uniqueness checker',
      'duplicate content checker',
      'repeated phrases finder',
      'text originality checker online',
      'check content for repetition',
      'readability checker free',
    ],
    metaDescription: 'Free content uniqueness checker: get a uniqueness score, find repeated phrases, and grade readability. Text is analyzed privately, never stored.',
  },

  'keyword-tool': {
    longDescription: [
      'The Keyword Tool turns one seed keyword into a list of real search queries pulled live from Google Autocomplete. Enter a term like "digital marketing" and the Exyconn server expands it into the suggestions Google itself shows searchers — actual phrases people type, not synthetic combinations from a keyword database. Each result comes with its word and character count so long-tail opportunities stand out immediately.',
      'Because Autocomplete is driven by genuine search behavior, every suggestion represents demonstrated demand: if Google suggests it, people are searching it. That makes this the fastest way to validate a topic, discover the question and modifier patterns around a niche, and collect secondary keywords for an article — without creating an account or burning API credits in a paid suite.',
      'Bloggers use it to pick post angles, e-commerce owners to name category pages after real queries, and PPC managers to seed ad groups before opening Keyword Planner. The Copy All button exports the entire list in one click for a spreadsheet or brief, and running a few seed variations back to back builds a usable keyword set for a whole topic cluster in minutes.',
    ],
    features: [
      'Live keyword suggestions from Google Autocomplete',
      'Every suggestion is a real query people type into Google',
      'Word and character counts to spot long-tail keywords',
      'Total suggestion count shown per seed keyword',
      'Copy All exports the full list in one click',
      'No signup, no API key, no daily quota',
    ],
    useCases: [
      'Find blog post angles around a broad topic',
      'Collect secondary keywords for an existing article',
      'Discover question-format queries for FAQ content',
      'Seed a PPC ad group with real search phrases',
      'Validate demand for a niche before building content around it',
    ],
    howTo: [
      'Enter a seed keyword such as "digital marketing".',
      'Click "Find Keywords" or press Enter.',
      'Browse the suggestions table — use the Words column to filter long-tail phrases.',
      'Click "Copy All" to export the list to your clipboard.',
      'Repeat with variations of your seed to widen the keyword set.',
    ],
    faqs: [
      {
        question: 'Where do the keyword suggestions come from?',
        answer: 'Directly from Google Autocomplete, fetched live by the Exyconn server. They are the same suggestions Google shows in its search box, driven by real search behavior.',
      },
      {
        question: 'Does the tool show search volume for each keyword?',
        answer: 'No — volume figures require the Google Ads Keyword Planner API. What this tool guarantees is that every suggestion is a query with real demand, since Google only suggests phrases people actually search.',
      },
      {
        question: 'How do I find long-tail keywords in the results?',
        answer: 'Use the Words column: suggestions with 3+ words are long-tail phrases, which are typically easier to rank for and convert better.',
      },
      {
        question: 'Can I use it for non-English keywords?',
        answer: 'Yes. Enter a seed in any language and Autocomplete returns suggestions in that language.',
      },
      {
        question: 'Is there a limit on lookups?',
        answer: 'No account or quota is enforced — run as many seed keywords as you need.',
      },
    ],
    keywords: [
      'free keyword tool',
      'keyword research tool free',
      'google autocomplete keyword tool',
      'long tail keyword finder',
      'keyword suggestion tool',
      'find keywords for blog',
      'keyword ideas generator',
      'seo keyword finder free',
    ],
    metaDescription: 'Free keyword tool: expand any seed term into real Google Autocomplete queries, spot long-tail phrases, and copy the whole list instantly.',
  },

  'keyword-rank-checker': {
    longDescription: [
      'The Keyword Rank Checker analyzes the SEO health factors that determine how well a website can rank. Enter a URL and the Exyconn server fetches the live page and scores it out of 100, reporting the elements that feed directly into ranking ability: the page title and meta description, heading distribution (H1–H3), internal and external link counts, and measured page load time — the technical foundation every keyword ranking rests on.',
      'Tracking exact keyword positions requires Google Search Console access, so instead of showing estimated positions from a stale index, this tool focuses on what you can actually control: whether your page is technically capable of ranking. A missing H1, a weak meta description, or a slow load time will cap your positions no matter how good the content is — and each of those shows up clearly in the results.',
      'Use it alongside Search Console: when GSC shows a keyword stuck on page two, run the ranking URL through this checker to find the on-page weaknesses holding it back, fix them, and watch the position move. It works just as well on the page that outranks you — comparing the two reports side by side usually makes the gap, and the fix, obvious.',
    ],
    features: [
      'SEO health score out of 100 for any URL',
      'Page title and meta description extraction',
      'Heading structure breakdown (H1, H2, H3 counts)',
      'Internal and external link counts',
      'Measured page load time with a 3-second threshold flag',
      'Instant analysis — no account or Search Console linking needed',
    ],
    useCases: [
      'Diagnose why a page is stuck on page two of Google',
      'Check the technical ranking foundation of a new landing page',
      'Compare on-page health between your page and the one outranking it',
      'Verify heading structure and meta tags after a template change',
    ],
    howTo: [
      'Enter the URL of the page whose ranking potential you want to assess.',
      'Click "Analyze SEO" or press Enter.',
      'Review the SEO score and the internal/external link counts.',
      'Check the extracted title and meta description read the way you intended.',
      'Inspect the H1/H2/H3 chips and the load time — fix anything flagged, then re-run.',
    ],
    faqs: [
      {
        question: 'Does this show my exact position for a keyword?',
        answer: 'No — precise position tracking requires the Google Search Console API. This tool analyzes the on-page SEO health that determines your ranking ability, which is the part you can directly fix.',
      },
      {
        question: 'How does SEO health relate to rankings?',
        answer: 'On-page factors are ranking prerequisites: a page with a missing H1, weak meta description, or slow load time is capped below its potential regardless of content quality. Fixing them removes the ceiling.',
      },
      {
        question: 'What is a good load time?',
        answer: 'Under 3 seconds. The tool flags load time green below that threshold and amber above it, since slow pages lose both rankings and visitors.',
      },
      {
        question: 'Can I analyze a competitor page?',
        answer: 'Yes — any public URL works. Running the page that outranks you reveals how its on-page fundamentals compare to yours.',
      },
    ],
    keywords: [
      'keyword rank checker free',
      'google ranking checker',
      'check website ranking factors',
      'seo health checker',
      'why is my page not ranking',
      'page ranking analysis tool',
      'website rank analysis free',
    ],
    metaDescription: 'Free keyword rank checker: analyze the on-page SEO health that controls your Google rankings — score, headings, links, and load time.',
  },

  'keyword-volume-checker': {
    longDescription: [
      'The Keyword Search Volume tool takes up to five keywords at once and expands each into the real queries Google Autocomplete associates with it, merging everything into a single de-duplicated list. Enter your keywords one per line and the Exyconn server fetches live suggestions for each seed, so from five terms you typically get dozens of proven search phrases with word and character counts attached.',
      'Exact monthly volume figures come only from the Google Ads Keyword Planner API, so rather than displaying made-up numbers, this tool gives you something more dependable: every phrase it returns is one Google actively suggests to searchers, which means it carries real demand. The batch input makes it the quickest way to explore several topic clusters in a single run.',
      'It fits content planners mapping out a topic cluster, SEO freelancers building a keyword universe for a new client, and store owners checking which product-related phrases people genuinely search — all without a Google Ads account. Enter five product or topic names at once, copy the merged list, and you have a research-backed starting point for a whole content calendar in one run.',
    ],
    features: [
      'Batch input — up to 5 keywords analyzed in one run',
      'Live suggestions from Google Autocomplete per seed',
      'Automatic de-duplication across all seeds',
      'Word and character counts for every result',
      'Copy All exports the merged list in one click',
      'No Google Ads account or API key required',
    ],
    useCases: [
      'Explore five topic clusters in a single batch run',
      'Build a keyword universe for a new client or niche',
      'Compare which of several seed terms generates the most variations',
      'Collect proven queries for a content calendar',
    ],
    howTo: [
      'Enter up to five keywords, one per line.',
      'Click "Get Keyword Ideas".',
      'Wait while suggestions are fetched for each seed keyword in turn.',
      'Browse the merged, de-duplicated results table.',
      'Click "Copy All" to export the full keyword list.',
    ],
    faqs: [
      {
        question: 'Does the tool show exact monthly search volumes?',
        answer: 'No — precise volume, CPC, and competition figures require the Google Ads Keyword Planner API. Instead the tool returns real Autocomplete suggestions, each of which is a query with demonstrated demand.',
      },
      {
        question: 'Why only five keywords per run?',
        answer: 'Each seed triggers its own live Autocomplete fetch; capping at five keeps the batch fast. Run additional batches for larger lists.',
      },
      {
        question: 'Are duplicate suggestions removed?',
        answer: 'Yes. When two seeds produce the same suggestion, it appears once in the merged table.',
      },
      {
        question: 'How can I gauge demand without a volume number?',
        answer: 'Presence in Autocomplete is itself a demand signal — Google only suggests phrases people search. Shorter, broader phrases generally carry higher volume than long-tail ones.',
      },
    ],
    keywords: [
      'keyword search volume checker free',
      'bulk keyword tool',
      'keyword ideas generator free',
      'check keyword demand',
      'batch keyword research tool',
      'google keyword suggestions bulk',
      'keyword volume tool no signup',
    ],
    metaDescription: 'Free bulk keyword tool: enter up to 5 seeds and get real Google search queries, merged and de-duplicated, ready to copy — no Ads account.',
  },

  'backlink-checker': {
    longDescription: [
      'The Backlink Checker maps the complete link profile of any web page. Enter a URL and the Exyconn server fetches the live page and classifies every link on it: internal versus external, dofollow versus nofollow, with totals, percentages, and the full list of unique external domains the page links out to. An external-links table shows each URL alongside its anchor text and rel attribute.',
      'On-page link data answers questions paid backlink indexes cannot: How does this site distribute its link equity? Which domains does it endorse with dofollow links? Is its internal-to-external ratio healthy? Because the analysis reads the actual live HTML rather than a crawled index, the results reflect the page exactly as it is right now — including links added or removed minutes ago.',
      'SEO practitioners use it to audit outbound linking on their own pages, verify that sponsored links carry nofollow, review anchor text patterns, and inspect where a competitor sends its dofollow links — a fast way to discover the resources and partners a rival site endorses. Every discovered link can be opened directly in a new tab, so following up on anything suspicious takes one click.',
    ],
    features: [
      'Full link classification: internal, external, dofollow, nofollow',
      'Percentage breakdown of the link profile',
      'Unique external domains listed as chips',
      'External links table with anchor text and rel attribute',
      'Reads the live page — results are always current',
      'Open any discovered link directly in a new tab',
    ],
    useCases: [
      'Audit outbound links on your own pages',
      'Verify sponsored or affiliate links carry nofollow',
      'See which domains a competitor endorses with dofollow links',
      'Review anchor text patterns across a page',
      'Check the internal-to-external link ratio of a key landing page',
    ],
    howTo: [
      'Enter the URL of the page you want to analyze.',
      'Click "Analyze Links" or press Enter.',
      'Read the summary cards: total, internal, external, and nofollow percentages.',
      'Scan the unique external domains chips for anything unexpected.',
      'Use the external links table to inspect individual URLs, anchors, and rel attributes.',
    ],
    faqs: [
      {
        question: 'Does this show backlinks pointing TO my site from other websites?',
        answer: 'It analyzes the links ON the page you enter — outbound and internal. A full inbound backlink index requires a crawler like Ahrefs or Google Search Console; this tool gives you the live on-page link profile instead.',
      },
      {
        question: 'What is the difference between dofollow and nofollow?',
        answer: 'Dofollow links pass ranking signal to the target; nofollow links tell search engines not to. Sponsored and user-generated links should generally be nofollow.',
      },
      {
        question: 'Why does my nofollow percentage matter?',
        answer: 'A page whose paid or affiliate links are dofollow risks a Google link-scheme penalty. The breakdown makes it easy to spot links that should be marked nofollow.',
      },
      {
        question: 'Is the data live or from an index?',
        answer: 'Live. The server fetches the page HTML at the moment you run the check, so recently added or removed links are reflected immediately.',
      },
      {
        question: 'Can I analyze any website?',
        answer: 'Any publicly accessible URL — including competitor pages. Pages behind logins cannot be fetched.',
      },
    ],
    keywords: [
      'free backlink checker',
      'link analyzer online',
      'dofollow nofollow checker',
      'external links checker',
      'anchor text analysis tool',
      'website link audit free',
      'outbound link checker',
    ],
    metaDescription: 'Free link analyzer: classify every link on a page — internal, external, dofollow, nofollow — with anchor text and unique domains, live.',
  },

  'website-authority-checker': {
    longDescription: [
      'The Website Authority Checker estimates the quality of any domain by auditing the on-page signals that authoritative sites consistently get right. Enter a domain and the Exyconn server fetches the live homepage, scoring it out of 100 and reporting the metrics behind the number: word count, internal and external link counts, image usage, and how many Schema.org types the site declares — followed by a list of concrete improvement tips drawn from the issues found.',
      'Proprietary metrics like Moz DA or Ahrefs DR are computed from private backlink indexes; this tool takes the complementary approach and measures what the site itself demonstrates. Thin content, missing structured data, and a weak link structure are the on-page fingerprints of a low-authority site, and they are entirely within your control to fix — unlike someone else\'s backlink graph.',
      'Site owners use it to benchmark their own domain and work through the tips list; link builders use it as a fast first-pass quality filter before spending paid credits on a full DA/DR lookup for a prospect. Because the score is recomputed live on every run, it doubles as a progress tracker — fix the flagged issues, re-check the domain, and the improvement shows up immediately.',
    ],
    features: [
      'Authority-style quality score out of 100',
      'Visual score bar with green / amber / red grading',
      'Key metrics: word count, links, images, schema types',
      'Concrete improvement tips generated from detected issues',
      'Works on any public domain — yours or a prospect\'s',
      'Instant results, no account required',
    ],
    useCases: [
      'Benchmark your domain\'s on-page quality before a link-building campaign',
      'Pre-screen guest post prospects before paying for DA/DR lookups',
      'Track score improvement while working through the tips list',
      'Compare on-page quality between your site and a competitor',
    ],
    howTo: [
      'Enter a domain, e.g. example.com — the protocol is added automatically.',
      'Click "Check Authority".',
      'Read the score and the color-graded progress bar.',
      'Review the key metric chips: word count, links, images, and schema types.',
      'Work through the improvement tips, then re-check to measure progress.',
    ],
    faqs: [
      {
        question: 'Is this score the same as Moz DA or Ahrefs DR?',
        answer: 'No. DA and DR are computed from private backlink indexes. This score measures on-page quality signals — content depth, link structure, and structured data — which correlate with authority and, unlike backlinks, are directly fixable by you.',
      },
      {
        question: 'Why does on-page quality matter for authority?',
        answer: 'Authoritative sites almost universally have substantial content, clean link structure, and structured data. A domain missing those basics rarely earns strong rankings regardless of its backlink count.',
      },
      {
        question: 'What is a good score?',
        answer: '80+ shows green and indicates solid fundamentals. Below 50 shows red, meaning several core on-page factors need attention — the tips list tells you which.',
      },
      {
        question: 'Can I check a competitor\'s domain?',
        answer: 'Yes, any publicly accessible domain works. The server fetches the homepage the same way a crawler would.',
      },
    ],
    keywords: [
      'website authority checker free',
      'domain authority checker',
      'check domain quality',
      'website quality score',
      'da checker alternative',
      'domain strength checker free',
      'site authority test',
    ],
    metaDescription: 'Free website authority checker: score any domain\'s on-page quality out of 100 with key metrics and concrete tips to raise it.',
  },

  'website-traffic-checker': {
    longDescription: [
      'The Website Traffic Checker profiles the signals that drive and reflect a website\'s traffic. Enter a URL and the Exyconn server fetches the live page and reports across five panels: performance (measured load time, page size, and counts of scripts, stylesheets, images, and iframes), content and SEO (title, meta description, word count, internal pages), the detected technology stack, linked social platforms, and the full list of external domains the site connects to.',
      'Analytics-grade visitor numbers exist only inside a site\'s own analytics account, so this tool measures what is publicly observable instead — and those signals are revealing. Load time and page weight directly gate how much traffic a site can convert, internal page count indicates content depth, social links show which acquisition channels the site invests in, and the technology stack tells you what it runs on.',
      'It is handy for competitive research and technical due diligence alike: profile a competitor\'s site to see its stack and social channels, or run your own site to catch bloated pages and slow load times before they cost you visitors. Everything is measured live at the moment you run the check — no cached third-party estimates — so a performance fix you deployed five minutes ago already shows in the numbers.',
    ],
    features: [
      'Measured load time and total page size in KB',
      'Resource counts: scripts, stylesheets, images, iframes',
      'Title, meta description, and word count extraction',
      'Technology stack detection (CMS, frameworks, analytics)',
      'Social platform presence from on-page links',
      'Full list of external domains the site links to',
    ],
    useCases: [
      'Profile a competitor\'s technology stack and social channels',
      'Find out why your page loads slowly — scripts, images, or sheer size',
      'Do quick technical due diligence on a site before a partnership',
      'Audit page weight after adding a new marketing script',
    ],
    howTo: [
      'Enter the website URL you want to profile.',
      'Click "Analyze Website" or press Enter.',
      'Check the performance panel for load time, page size, and resource counts.',
      'Review the content, technology stack, and social presence panels.',
      'Scan the external domains table to see who the site links to.',
    ],
    faqs: [
      {
        question: 'Does this show exact visitor numbers?',
        answer: 'No tool outside a site\'s own analytics can show real visitor counts. This checker analyzes the public signals that drive traffic: performance, content depth, technology, social channels, and link profile.',
      },
      {
        question: 'How is load time measured?',
        answer: 'The Exyconn server times the actual fetch of the page at the moment you run the check, so it reflects real current performance rather than a cached estimate.',
      },
      {
        question: 'How does the technology detection work?',
        answer: 'The page HTML is scanned for framework, CMS, and analytics fingerprints — script URLs, meta generators, and markup patterns — and each detected technology is listed as a chip.',
      },
      {
        question: 'Why do script and stylesheet counts matter?',
        answer: 'Every script and stylesheet is an extra request that slows first load. High counts are the most common cause of a slow site and are usually easy wins to consolidate.',
      },
      {
        question: 'Can I analyze any website?',
        answer: 'Any publicly reachable URL, including competitors. Pages behind logins cannot be analyzed.',
      },
    ],
    keywords: [
      'website traffic checker free',
      'website analyzer online',
      'check website technology stack',
      'page speed and size checker',
      'competitor website analysis free',
      'what cms does a website use',
      'website performance checker',
    ],
    metaDescription: 'Free website analyzer: check load time, page size, tech stack, social presence and link profile of any site — instant, no signup.',
  },

  'competitor-finder': {
    longDescription: [
      'The Competitor Finder discovers the websites most closely connected to any domain by analyzing where it links. Enter a URL and the Exyconn server fetches the site, extracts every external link, and ranks the linked domains by how often they are mentioned — sites referenced repeatedly are almost always industry peers, partners, tools, or direct competitors. Each result shows the mention count and the actual anchor texts used.',
      'The tool also builds context for the analyzed site itself — its title, description, and detected technologies — so you can confirm you profiled the right property before reading the results. Because everything comes from the live page rather than a search index, the related-sites list reflects the site\'s real current ecosystem: who it cites, integrates with, and compares itself to.',
      'Run it on your own domain to audit which sites you are sending visitors and link equity to, or on a known competitor to uncover their partners, suppliers, and the tools they rely on — each discovered domain opens in a new tab, and the whole list copies in one click. Content-rich pages such as blog posts and resource pages produce the richest results, since they carry the most outbound links to analyze.',
    ],
    features: [
      'Related sites ranked by mention frequency',
      'Anchor texts shown for every discovered domain',
      'Site context: title, description, detected technologies',
      'Total external domain count for the analyzed site',
      'Open any discovered domain directly in a new tab',
      'Copy Domains exports the full list in one click',
    ],
    useCases: [
      'Map a competitor\'s ecosystem of partners and suppliers',
      'Discover which tools and platforms a rival site relies on',
      'Audit which sites your own domain endorses with links',
      'Build a prospect list of industry-adjacent sites for outreach',
    ],
    howTo: [
      'Enter a website URL — yours or a competitor\'s.',
      'Click "Find Related Sites" or press Enter.',
      'Confirm the site context card matches the site you meant to analyze.',
      'Review the related sites table, sorted by mention count, with anchor texts.',
      'Click "Copy Domains" to export the list, or open any domain in a new tab.',
    ],
    faqs: [
      {
        question: 'How does linking reveal competitors?',
        answer: 'Sites link most often to the domains in their own ecosystem: partners, industry resources, tools, and comparison targets. Ranking external links by frequency surfaces that ecosystem — which usually contains the real competitors.',
      },
      {
        question: 'Why did my site return few or no related sites?',
        answer: 'The analysis is based on external links found on the page. A site with very few outbound links — common for minimal landing pages — gives the tool little to work with. Try a content-rich page like a blog index.',
      },
      {
        question: 'Whose URL should I enter — mine or my competitor\'s?',
        answer: 'Both are useful. Your own URL audits who you link to; a competitor\'s URL reveals their partners, suppliers, and tooling.',
      },
      {
        question: 'What do the anchor text chips tell me?',
        answer: 'The words a site uses when linking to a domain reveal the relationship — "powered by", a brand name, or "read the comparison" each imply something different about how the two sites relate.',
      },
    ],
    keywords: [
      'competitor finder free',
      'find website competitors',
      'related websites finder',
      'competitor analysis tool free',
      'who are my competitors online',
      'website ecosystem analysis',
      'find similar websites',
    ],
    metaDescription: 'Free competitor finder: analyze any site\'s external links to reveal its partners, tools and rivals, ranked by mentions with anchor text.',
  },

  'ai-search-visibility': {
    longDescription: [
      'The AI Search Visibility tool measures how ready your website is to be found and cited by AI search engines like ChatGPT, Perplexity, and Gemini. Enter your URL and the Exyconn server analyzes the content signals AI models rely on when choosing sources: overall SEO score, word count, whether Schema.org structured data is present, heading structure (H1/H2), and the internal and external link profile.',
      'AI assistants answer questions by drawing on pages they can parse and trust — and their preferences are measurable. They favor substantial, well-structured content with clear headings, machine-readable structured data, and consistent entity information. The tool flags each of these factors and pairs the analysis with a checklist of proven tactics: FAQ-formatted sections, Schema.org markup, Wikipedia/Wikidata presence, and long-form authoritative content.',
      'As search traffic shifts from blue links to AI answers, brands invisible to language models lose discovery they never see in analytics. This check is for marketers and founders who want a concrete, fixable list of reasons an AI assistant might skip their site when answering questions in their niche.',
    ],
    features: [
      'AI readiness analysis based on measurable content signals',
      'Structured data (Schema.org) detection — a key AI parsing signal',
      'Word count check against the 300-word content depth threshold',
      'Heading structure and link profile breakdown',
      'Actionable checklist of seven proven AI-visibility tactics',
      'Works for any public website, no account needed',
    ],
    useCases: [
      'Check whether ChatGPT or Perplexity can parse and cite your site',
      'Prepare a brand site for AI-driven discovery before a launch',
      'Verify structured data is in place after adding schema markup',
      'Build a prioritized to-do list for improving AI answer presence',
    ],
    howTo: [
      'Enter your website URL.',
      'Click "Check Visibility" or press Enter.',
      'Review the readiness panel: SEO score, word count, and structured data status.',
      'Check the heading and link chips for structural gaps.',
      'Work through the improvement tips — structured data and FAQ sections first.',
    ],
    faqs: [
      {
        question: 'Does this query ChatGPT or Perplexity directly?',
        answer: 'No — it analyzes your site for the content signals those systems rely on when selecting sources: structure, depth, structured data, and links. Those are the factors you can actually fix.',
      },
      {
        question: 'Why does structured data matter for AI visibility?',
        answer: 'Schema.org markup describes your content in machine-readable form — organization, product, FAQ, article. AI models and the search indexes they draw on use it to understand and confidently cite your pages.',
      },
      {
        question: 'Why is 300 words a threshold?',
        answer: 'Pages under roughly 300 words rarely contain enough substance for an AI model to extract a useful answer from, so thin pages are seldom cited. The word count chip turns green above that mark.',
      },
      {
        question: 'What is the fastest win from the tips list?',
        answer: 'Adding an FAQ section with Schema.org FAQ markup — AI assistants frequently pull from question-and-answer formatted content, and it is usually a one-day change.',
      },
      {
        question: 'How is AI search visibility different from normal SEO?',
        answer: 'They overlap heavily — AI systems build on search indexes — but AI answers weight machine-readable structure, entity consistency, and Q&A formats more strongly than classic ranking factors do.',
      },
    ],
    keywords: [
      'ai search visibility checker',
      'chatgpt visibility check',
      'perplexity seo tool',
      'ai seo checker free',
      'brand visibility in ai search',
      'llm optimization tool',
      'geo generative engine optimization',
      'get cited by chatgpt',
    ],
    metaDescription: 'Free AI search visibility checker: see if ChatGPT, Perplexity and Gemini can parse your site, plus a concrete checklist to get cited.',
  },
};
