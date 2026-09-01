import type { ToolDetailsMap } from './types';

/** Detail content for the "converter" tool category. Keyed by tool id from toolsData. */
export const converterToolDetails: ToolDetailsMap = {
  'pdf-to-markdown': {
    longDescription: [
      'PDF to Markdown extracts the text of a PDF file and rewrites it as clean Markdown you can drop straight into a README, wiki, or static-site generator. Upload a PDF, click Convert, and the tool returns headings, paragraphs, and lists as portable plain text — no more retyping documents or fighting the broken line breaks that come with copy-pasting from a PDF viewer.',
      'Conversion runs on the Exyconn server: your file is posted over HTTPS, parsed in memory, and the resulting Markdown is streamed straight back to your browser. Nothing is written to disk or retained after the response, so the tool is safe to use with internal reports and client documents. The output appears beside the upload area so you can review it before copying.',
      'It is built for developers migrating documentation into Git, writers repurposing PDF reports for blogs or wikis, and anyone feeding PDF content into Markdown-first apps such as Obsidian or Docusaurus. Copy the result to your clipboard with one click, or download it as a .md file automatically named after the original PDF.',
    ],
    features: [
      'Drag-and-drop or click-to-browse PDF upload',
      'Converts headings, paragraphs, and lists into Markdown syntax',
      'Side-by-side layout with a live Markdown output panel',
      'One-click copy to clipboard',
      'Downloads a .md file named after the original PDF',
      'Files are parsed in memory on the server and never stored',
    ],
    useCases: [
      'Migrate a PDF manual into a Git-hosted documentation site',
      'Turn a PDF report into a blog post or internal wiki page',
      'Pull PDF content into Obsidian or another Markdown note app',
      'Recover editable text from a PDF whose source document is lost',
      'Prepare PDF content as clean plain text for an AI prompt',
    ],
    howTo: [
      'Drag a PDF into the upload area, or click it to browse for a file.',
      'Click Convert to send the file for text extraction.',
      'Review the generated Markdown in the output panel on the right.',
      'Click the copy icon to copy it, or the download icon to save a .md file.',
    ],
    faqs: [
      {
        question: 'Is my PDF stored on your servers?',
        answer:
          'No. The file is parsed in memory on the Exyconn server and discarded as soon as the Markdown is returned. Nothing is saved to disk or logged.',
      },
      {
        question: 'Does it work with scanned PDFs?',
        answer:
          'No — this tool extracts the text layer embedded in the PDF. A scanned document is just an image, so run it through the OCR PDF tool first to add a text layer.',
      },
      {
        question: 'How much formatting is preserved?',
        answer:
          'Headings, paragraphs, and lists come through as Markdown. Multi-column layouts and complex tables are flattened to text and may need a quick manual touch-up.',
      },
      {
        question: 'Is the converter free?',
        answer: 'Yes. Converting PDFs to Markdown is completely free, with no sign-up required.',
      },
      {
        question: 'Can I convert several PDFs at once?',
        answer:
          'The tool converts one file at a time. To process several, convert and download each one in turn — there is no daily limit.',
      },
    ],
    keywords: [
      'pdf to markdown',
      'convert pdf to markdown',
      'pdf to md converter',
      'extract text from pdf',
      'pdf to markdown online free',
      'pdf to md',
      'pdf markdown converter',
    ],
    metaDescription:
      'Convert PDF files to clean Markdown online for free. Upload a PDF and get copy-ready .md text with headings and lists — files are never stored.',
  },

  'csv-to-markdown': {
    longDescription: [
      'CSV to Markdown turns raw comma-separated data into a properly aligned Markdown table, ready to paste into GitHub READMEs, pull-request descriptions, wikis, or documentation sites. Paste CSV straight into the editor or upload a .csv file, tell the tool whether the first row is a header, and it builds the pipe-and-dash table syntax for you — no manual alignment needed.',
      'Writing Markdown tables by hand is tedious and error-prone: one missing pipe breaks the whole table. This tool generates the delimiter row and escapes cell content correctly on the Exyconn server, then returns the finished table to your browser. Your data is processed in memory for the conversion and never stored, so it is fine to use with exported business data.',
      'It suits developers documenting API responses or config matrices, analysts sharing spreadsheet extracts in Slack or GitHub, and writers who keep tabular content in version control. The finished table appears in a monospace preview so you can check the alignment, then copy it to the clipboard with one click or download it as a table.md file.',
    ],
    features: [
      'Paste CSV content or upload a .csv file',
      'Toggle whether the first row is treated as a table header',
      'Generates correctly aligned pipe-and-dash Markdown table syntax',
      'Monospace preview of the finished table before you copy it',
      'One-click copy to clipboard or download as table.md',
      'Data is converted in memory and never stored',
    ],
    useCases: [
      'Paste a spreadsheet export into a GitHub README as a table',
      'Share query results as a readable table in a pull request or issue',
      'Convert exported analytics data into a wiki-friendly table',
      'Keep pricing or feature-comparison tables in Markdown docs',
    ],
    howTo: [
      'Paste your CSV content into the editor, or click Upload CSV to load a file.',
      'Use the "First row is header" switch to match your data.',
      'Click Convert to Markdown Table.',
      'Copy the generated table or download it as table.md.',
    ],
    faqs: [
      {
        question: 'What happens if my CSV has no header row?',
        answer:
          'Turn off the "First row is header" switch. Every row is then treated as data and a generic header row is generated for the table.',
      },
      {
        question: 'Does it handle commas inside quoted values?',
        answer:
          'Yes. Standard CSV quoting is respected, so values like "Doe, John" stay in a single cell instead of splitting across columns.',
      },
      {
        question: 'Is my data stored anywhere?',
        answer:
          'No. The CSV is sent to the Exyconn server over HTTPS, converted in memory, and discarded once the Markdown table is returned.',
      },
      {
        question: 'Where can I use the generated table?',
        answer:
          'Anywhere GitHub-flavored Markdown is rendered: GitHub and GitLab READMEs, issues and pull requests, Notion, Obsidian, Docusaurus, and most wiki engines.',
      },
      {
        question: 'Is there a limit on rows or columns?',
        answer:
          'There is no fixed row limit for typical files, but very wide tables render poorly in Markdown — consider splitting anything beyond a dozen columns.',
      },
    ],
    keywords: [
      'csv to markdown',
      'csv to markdown table',
      'convert csv to markdown',
      'markdown table generator',
      'csv to md table online free',
      'csv table converter',
      'github markdown table from csv',
    ],
    metaDescription:
      'Free CSV to Markdown table converter. Paste CSV or upload a file and get an aligned Markdown table for GitHub, wikis, and docs in one click.',
  },

  'json-to-markdown': {
    longDescription: [
      'JSON to Markdown converts structured JSON data into readable Markdown, turning nested objects and arrays into headings, lists, and tables that humans can actually scan. Paste JSON into the editor or upload a .json file, and the tool validates it in your browser before conversion — invalid JSON is flagged immediately with a clear error instead of producing garbage output.',
      'A built-in Format button pretty-prints the input so you can inspect deeply nested payloads before converting them. The conversion itself runs on the Exyconn server: your JSON is posted over HTTPS, transformed in memory, and returned as Markdown without ever being stored. That makes it practical for API responses and config files you would rather not paste into random websites.',
      'Use it to document API payloads in a README, publish configuration references for a wiki, or turn machine output into notes a teammate can actually read. It fits developers writing API guides, QA engineers sharing webhook payloads, and analysts explaining exported data. The result copies to your clipboard in one click or downloads as a data.md file.',
    ],
    features: [
      'Paste JSON or upload a .json file',
      'Client-side validation catches invalid JSON before conversion',
      'Format button pretty-prints the input for easier review',
      'Converts nested objects and arrays into structured Markdown',
      'One-click copy or download as data.md',
      'JSON is converted in memory on the server and never stored',
    ],
    useCases: [
      'Document a sample API response in a README or API guide',
      'Turn a JSON config file into a readable settings reference',
      'Convert exported JSON data into a shareable report',
      'Make webhook or log payloads readable for non-developers',
    ],
    howTo: [
      'Paste your JSON into the editor, or upload a .json file.',
      'Optionally click Format to pretty-print and sanity-check the input.',
      'Click Convert — invalid JSON is rejected with an error message.',
      'Copy the generated Markdown or download it as data.md.',
    ],
    faqs: [
      {
        question: 'What happens if my JSON is invalid?',
        answer:
          'The tool parses your input in the browser before sending anything. If it is not valid JSON you get an immediate "Invalid JSON format" error and nothing is submitted.',
      },
      {
        question: 'How are nested objects handled?',
        answer:
          'Nested structures become nested Markdown: objects map to headed sections or lists and arrays become bullet lists or tables, so hierarchy stays visible.',
      },
      {
        question: 'Is my JSON data stored?',
        answer:
          'No. It is sent over HTTPS to the Exyconn server, converted in memory, and discarded once the Markdown is returned.',
      },
      {
        question: 'Can I convert a large API response?',
        answer:
          'Yes — typical payloads convert in a second or two. Use the Format button first to confirm the structure looks right before converting.',
      },
      {
        question: 'Is this converter free to use?',
        answer: 'Yes, it is completely free with no account or sign-up required.',
      },
    ],
    keywords: [
      'json to markdown',
      'convert json to markdown',
      'json to md converter',
      'json to markdown table',
      'json to readable text',
      'json formatter markdown',
      'json to markdown online free',
    ],
    metaDescription:
      'Convert JSON to readable Markdown online for free. Validate, pretty-print, and turn nested JSON into clean headings, lists, and tables.',
  },

  'docx-to-markdown': {
    longDescription: [
      'DOCX to Markdown converts Microsoft Word documents into clean Markdown while keeping the structure you care about: headings, bold and italic text, lists, and links. Drag a .docx file into the upload area, click Convert, and the document comes back as plain Markdown — free of the invisible styling, smart quotes, and layout cruft that Word normally drags along.',
      'The conversion happens on the Exyconn server, where the .docx file is unpacked and mapped to Markdown in memory. Your document is never written to disk or kept after the response, so contracts, drafts, and internal docs are safe to convert. The output panel sits beside the uploader, letting you check the result before you take it anywhere.',
      'This is the fastest route from a Word draft to a Git-friendly format: writers moving articles into a CMS, teams migrating .docx documentation into a repository, and developers who receive specs in Word but live in Markdown. Copy the result with one click or download it as a .md file named after the original document.',
    ],
    features: [
      'Drag-and-drop or click-to-browse .docx upload',
      'Preserves headings, bold, italic, lists, and hyperlinks',
      'Strips Word-specific styling and layout clutter',
      'Live Markdown output panel next to the uploader',
      'One-click copy or download as a .md file named after the source',
      'Documents are converted in memory and never stored',
    ],
    useCases: [
      'Move a Word article into a Markdown-based CMS or blog',
      'Migrate .docx documentation into a Git repository',
      'Convert a spec received in Word into a project wiki page',
      'Clean Word formatting out of text destined for a README',
    ],
    howTo: [
      'Drag a .docx file into the upload area, or click it to browse.',
      'Click Convert to process the document.',
      'Review the Markdown in the output panel.',
      'Copy it to the clipboard or download the .md file.',
    ],
    faqs: [
      {
        question: 'Is my Word document stored after conversion?',
        answer:
          'No. The file is converted in memory on the Exyconn server and discarded as soon as the Markdown is sent back. Nothing is saved.',
      },
      {
        question: 'Does it support the older .doc format?',
        answer:
          'Only .docx is accepted. If you have a legacy .doc file, open it in Word or LibreOffice and save it as .docx first.',
      },
      {
        question: 'What happens to images in the document?',
        answer:
          'The converter focuses on text content — headings, formatting, lists, and links. Embedded images are not carried into the Markdown output.',
      },
      {
        question: 'Are tables converted?',
        answer:
          'Simple Word tables are converted to Markdown tables. Heavily merged or nested tables are flattened and may need manual adjustment.',
      },
      {
        question: 'Is the tool free?',
        answer: 'Yes — DOCX to Markdown conversion is free and requires no sign-up.',
      },
    ],
    keywords: [
      'docx to markdown',
      'word to markdown',
      'convert word to markdown',
      'docx to md converter',
      'word document to markdown online free',
      'doc to markdown',
      'word to md',
    ],
    metaDescription:
      'Convert Word (.docx) files to clean Markdown online for free. Keeps headings, lists, and links — strips Word clutter. Files never stored.',
  },

  'rtf-to-markdown': {
    longDescription: [
      'RTF to Markdown converts Rich Text Format documents into clean, portable Markdown. Paste raw RTF content into the editor or upload an .rtf file, click Convert, and the control words and formatting codes are translated into Markdown headings, emphasis, and lists — leaving you with readable plain text instead of a wall of backslash commands.',
      'RTF is a legacy format still produced by WordPad, TextEdit, and many export functions, but almost nothing modern consumes it well. This tool bridges the gap: the Exyconn server parses the RTF in memory and returns Markdown to your browser without storing the document, so old notes and exported files can be modernized safely.',
      'It is aimed at anyone digging documents out of older systems — WordPad notes, TextEdit files from a Mac, or CRM and email exports that only offer RTF as an output format. The converted Markdown copies to your clipboard in one click or downloads as converted.md, ready for any modern editor, wiki, or Git-based documentation workflow.',
    ],
    features: [
      'Paste RTF source or upload an .rtf file',
      'Translates RTF control codes into Markdown formatting',
      'Preserves headings, bold, italic, and lists',
      'Monospace editor for inspecting the raw RTF input',
      'One-click copy or download as converted.md',
      'Content is converted in memory and never stored',
    ],
    useCases: [
      'Modernize old WordPad or TextEdit documents into Markdown',
      'Convert RTF exports from legacy CRM or email systems',
      'Clean up rich-text notes for a Markdown knowledge base',
      'Prepare archived RTF content for a static-site migration',
    ],
    howTo: [
      'Paste your RTF content into the editor, or click Upload RTF to load a file.',
      'Click Convert to translate the formatting codes.',
      'Review the Markdown in the output panel.',
      'Copy the result or download it as converted.md.',
    ],
    faqs: [
      {
        question: 'What is RTF and why convert it?',
        answer:
          'Rich Text Format is a 1980s-era document format still emitted by WordPad, TextEdit, and legacy exports. Converting to Markdown makes that content usable in modern editors, wikis, and Git.',
      },
      {
        question: 'Can I paste RTF copied from a document?',
        answer:
          'Yes — paste the raw RTF source, which begins with an rtf1 control header. If you only have the file, use the Upload RTF button instead and the tool reads it for you.',
      },
      {
        question: 'Is my document stored anywhere?',
        answer:
          'No. The RTF is parsed in memory on the Exyconn server and discarded once the Markdown is returned.',
      },
      {
        question: 'What formatting survives the conversion?',
        answer:
          'Headings, bold, italic, and lists map to Markdown equivalents. Fonts, colors, and page-layout details have no Markdown counterpart and are dropped.',
      },
      {
        question: 'Is this converter free?',
        answer: 'Yes, RTF to Markdown conversion is completely free with no sign-up.',
      },
    ],
    keywords: [
      'rtf to markdown',
      'convert rtf to markdown',
      'rtf to md converter',
      'rich text to markdown',
      'rtf converter online free',
      'wordpad to markdown',
      'rtf to plain text',
    ],
    metaDescription:
      'Free RTF to Markdown converter. Paste rich text or upload an .rtf file and get clean Markdown with headings, lists, and emphasis intact.',
  },

  'html-to-markdown': {
    longDescription: [
      'HTML to Markdown converts HTML source code into clean, readable Markdown. Paste a snippet or a full page into the editor — or upload an .html file — and tags like h1-h6, strong, em, a, ul, and code are translated into their Markdown equivalents, while scripts, styles, and attribute noise are stripped away.',
      'The conversion runs on the Exyconn server: your HTML is posted over HTTPS, transformed in memory, and returned as Markdown without being stored. That makes it a safe scratchpad for content copied out of a CMS, an email template, or a legacy site you are migrating — nothing you paste is retained after the response reaches your browser.',
      'It is a daily driver for developers migrating sites to static-site generators, writers rescuing content from WYSIWYG editors, and anyone maintaining docs in Git. Copy the result with one click or download it as converted.md. If you want to convert a live page by its URL instead of pasting source, use the companion Webpage to Markdown tool.',
    ],
    features: [
      'Paste HTML source or upload an .html file',
      'Maps headings, emphasis, links, lists, and code to Markdown',
      'Strips scripts, styles, and attribute clutter automatically',
      'Handles snippets and full page source alike',
      'One-click copy or download as converted.md',
      'HTML is converted in memory and never stored',
    ],
    useCases: [
      'Migrate blog posts from a CMS into a static-site generator',
      'Convert email or newsletter HTML into editable Markdown',
      'Rescue content from a WYSIWYG editor for a Git-based workflow',
      'Turn documentation exported as HTML back into source Markdown',
    ],
    howTo: [
      'Paste your HTML into the editor, or upload an .html file.',
      'Click Convert to translate the markup.',
      'Review the Markdown output in the panel on the right.',
      'Copy the result or download it as converted.md.',
    ],
    faqs: [
      {
        question: 'Which HTML tags are converted?',
        answer:
          'Headings (h1-h6), paragraphs, bold and italic, links, ordered and unordered lists, blockquotes, code, and simple tables all map to Markdown. Unsupported tags are dropped and their text kept.',
      },
      {
        question: 'What happens to scripts and CSS?',
        answer:
          'Script and style blocks are removed entirely — Markdown has no equivalent, and you almost never want them in converted content.',
      },
      {
        question: 'Can I convert a whole webpage?',
        answer:
          'Yes — paste the full page source, or skip the copy step entirely and use the Webpage to Markdown tool, which fetches a URL for you.',
      },
      {
        question: 'Is my HTML stored on your servers?',
        answer:
          'No. It is converted in memory on the Exyconn server and discarded once the Markdown is returned.',
      },
      {
        question: 'Is the tool free to use?',
        answer: 'Yes, HTML to Markdown conversion is free with no limits on everyday use.',
      },
    ],
    keywords: [
      'html to markdown',
      'convert html to markdown',
      'html to md converter',
      'html to markdown online free',
      'markdown from html',
      'turn html into markdown',
      'html source to markdown',
    ],
    metaDescription:
      'Convert HTML to clean Markdown online for free. Paste code or upload a file — headings, links, and lists convert; scripts get stripped.',
  },

  'webpage-to-markdown': {
    longDescription: [
      'Webpage to Markdown fetches any public URL and converts the page content into clean Markdown. Type or paste the address, press Enter or click Convert Webpage, and the Exyconn server downloads the page, strips navigation chrome, scripts, and styling, and returns the article content as Markdown along with the page title — no copy-pasting, no view-source detour.',
      'Because the fetch happens server-side, it works on any publicly reachable page without browser extensions or CORS workarounds. The page is processed in memory and nothing about your request is stored. The detected page title is shown beneath the URL field and is also used to name the downloaded .md file, so saved conversions stay organized.',
      'Researchers use it to archive articles into Obsidian or Notion, developers use it to pull reference pages into project docs, and content teams use it to migrate old site content into Markdown-based systems. Copy the output with one click, or download it as a .md file automatically named after the page title, ready to drop into your notes or repository.',
    ],
    features: [
      'Converts any public webpage by URL — no copy-paste needed',
      'Server-side fetch avoids CORS and extension requirements',
      'Strips navigation, scripts, and styling down to content',
      'Detects and displays the page title',
      'Downloads a .md file automatically named after the page title',
      'Pages are processed in memory; requests are not stored',
    ],
    useCases: [
      'Archive an article into a Markdown knowledge base like Obsidian',
      'Migrate old website content into a static-site generator',
      'Save documentation or reference pages as offline .md files',
      'Collect competitor or research pages as clean text for analysis',
    ],
    howTo: [
      'Paste the full URL of the webpage, including https://.',
      'Press Enter or click Convert Webpage.',
      'Check the detected page title and review the Markdown output.',
      'Copy the result or download the title-named .md file.',
    ],
    faqs: [
      {
        question: 'Which pages can be converted?',
        answer:
          'Any page the Exyconn server can reach publicly. Pages behind logins, paywalls, or IP restrictions cannot be fetched.',
      },
      {
        question: 'Does it work on JavaScript-heavy sites?',
        answer:
          'The converter reads the HTML the server returns. Content rendered entirely by client-side JavaScript may be missing — article and documentation pages generally convert well.',
      },
      {
        question: 'What parts of the page are kept?',
        answer:
          'The main content: headings, paragraphs, links, lists, and images as Markdown references. Menus, sidebars, scripts, and styles are stripped.',
      },
      {
        question: 'Do you store the URLs I convert?',
        answer:
          'No. The page is fetched and converted in memory, the Markdown is returned to your browser, and nothing is retained.',
      },
      {
        question: 'Is this legal to use on any site?',
        answer:
          'Converting a page for personal reference is generally fine, but the content remains under its owner’s copyright — check the site’s terms before republishing.',
      },
    ],
    keywords: [
      'webpage to markdown',
      'url to markdown',
      'convert webpage to markdown',
      'website to markdown converter',
      'save webpage as markdown',
      'web page to md online free',
      'article to markdown',
    ],
    metaDescription:
      'Convert any webpage to Markdown by URL — free. Fetches the page, strips clutter, and returns clean .md content with the page title.',
  },

  'notion-to-markdown': {
    longDescription: [
      'Notion to Markdown converts a public Notion page into portable Markdown. Paste a notion.so or notion.site link, click Convert Notion Page, and the Exyconn server fetches the page and translates its blocks — headings, paragraphs, lists, to-dos, and code — into standard Markdown you can use anywhere, without going through Notion’s own export dialog.',
      'The tool works with any page shared to the web, so there is no login, integration token, or workspace access involved: only content the page already exposes publicly is read. The fetch and conversion happen in memory on the server and nothing is stored. The page title is detected automatically and used to name the downloaded .md file.',
      'It is handy for backing up published Notion docs outside the platform, moving content into Obsidian or a Git repository, and syndicating Notion-drafted articles to Markdown-based blogs and static-site generators. One click copies the result to your clipboard; another downloads it as a .md file named after the page, ready to commit.',
    ],
    features: [
      'Converts public notion.so and notion.site pages by URL',
      'No Notion login, token, or integration required',
      'Translates Notion blocks into standard Markdown',
      'Detects and displays the page title',
      'Downloads a .md file named after the page',
      'Pages are converted in memory; nothing is stored',
    ],
    useCases: [
      'Back up a published Notion doc as a plain .md file',
      'Move Notion content into Obsidian or another Markdown app',
      'Publish a Notion draft on a Markdown-based blog or docs site',
      'Commit Notion-authored documentation into a Git repository',
    ],
    howTo: [
      'Open your Notion page and make sure it is shared to the web.',
      'Paste the notion.so or notion.site URL into the input field.',
      'Press Enter or click Convert Notion Page.',
      'Copy the Markdown or download the title-named .md file.',
    ],
    faqs: [
      {
        question: 'Why does my page fail to convert?',
        answer:
          'The page must be publicly shared. In Notion, open Share and enable "Publish to web" (or share to web), then try the link again — private pages cannot be read.',
      },
      {
        question: 'Do I need to connect my Notion account?',
        answer:
          'No. The tool reads only what the public link already exposes, so no login, API key, or workspace integration is required.',
      },
      {
        question: 'Which Notion blocks are supported?',
        answer:
          'Text blocks convert well: headings, paragraphs, bullet and numbered lists, to-dos, quotes, and code. Databases and complex embeds have no Markdown equivalent and are simplified or skipped.',
      },
      {
        question: 'Are subpages converted too?',
        answer:
          'No — only the page at the URL you provide. Convert each subpage separately by pasting its own link.',
      },
      {
        question: 'Is anything stored after conversion?',
        answer:
          'No. The page is fetched and converted in memory on the Exyconn server and discarded once the Markdown is returned.',
      },
    ],
    keywords: [
      'notion to markdown',
      'convert notion page to markdown',
      'notion export markdown',
      'notion page to md',
      'notion to markdown online free',
      'download notion page as markdown',
      'notion markdown converter',
    ],
    metaDescription:
      'Convert public Notion pages to Markdown online for free. Paste a notion.so link and get clean .md output — no login or export dialog needed.',
  },

  'google-docs-to-markdown': {
    longDescription: [
      'Google Docs to Markdown converts a shared Google Doc into clean Markdown straight from its URL. Paste a docs.google.com link, click Convert Google Doc, and the Exyconn server fetches the document and returns its headings, formatting, lists, and links as Markdown — skipping the usual dance of downloading, re-uploading, or copy-pasting through an editor.',
      'The document needs link sharing enabled ("Anyone with the link can view"); with that in place no Google sign-in or Drive permission is required, because the tool reads only what the link already exposes. The fetch and conversion run in memory on the server, nothing is stored, and the detected document title is shown and used to name the downloaded .md file.',
      'It fits teams that draft in Google Docs but publish in Markdown: engineers moving specs into a repo, technical writers feeding a docs-as-code pipeline, and bloggers pushing drafts to static-site generators. Copy the output in one click, or download it as a .md file named after the document title, ready to commit alongside your code.',
    ],
    features: [
      'Converts Google Docs by URL — no download or re-upload step',
      'No Google sign-in or Drive permissions required',
      'Preserves headings, bold, italic, lists, and links',
      'Detects and displays the document title',
      'Downloads a .md file named after the document',
      'Documents are converted in memory; nothing is stored',
    ],
    useCases: [
      'Publish a Google Docs draft on a Markdown-based blog',
      'Move a spec written in Docs into a Git repository',
      'Feed Docs-drafted content into a docs-as-code pipeline',
      'Convert meeting notes into Markdown for a team wiki',
    ],
    howTo: [
      'In Google Docs, open Share and set access to "Anyone with the link can view".',
      'Copy the document URL and paste it into the input field.',
      'Press Enter or click Convert Google Doc.',
      'Copy the Markdown or download the title-named .md file.',
    ],
    faqs: [
      {
        question: 'Why do I get an error for my document?',
        answer:
          'Almost always sharing: the doc must have "Anyone with the link can view" enabled. Restricted documents cannot be fetched, since the tool has no access to your Google account.',
      },
      {
        question: 'Do I need to sign in with Google?',
        answer:
          'No. The tool reads only what the share link exposes publicly, so no sign-in, OAuth grant, or Drive permission is involved.',
      },
      {
        question: 'What formatting is preserved?',
        answer:
          'Headings, bold, italic, links, and bullet and numbered lists convert to Markdown. Comments, suggestions, headers/footers, and drawings are not included.',
      },
      {
        question: 'Are images in the document converted?',
        answer:
          'The conversion focuses on text content. Embedded images are not extracted into the Markdown output.',
      },
      {
        question: 'Is my document stored after conversion?',
        answer:
          'No. It is fetched and converted in memory on the Exyconn server and discarded once the Markdown is returned. You can also revoke link sharing afterwards.',
      },
    ],
    keywords: [
      'google docs to markdown',
      'convert google doc to markdown',
      'google docs to md',
      'export google docs as markdown',
      'google docs markdown converter free',
      'gdocs to markdown',
      'docs to markdown online',
    ],
    metaDescription:
      'Free Google Docs to Markdown converter. Paste a shared doc link and get clean .md with headings, lists, and links — no sign-in needed.',
  },

  'text-to-markdown': {
    longDescription: [
      'Text to Markdown turns unstructured plain text into structured Markdown by detecting the patterns already in your writing. Paste text or upload a .txt file and the converter recognizes ALL-CAPS lines as headings, lines starting with dashes, asterisks, or numbers as lists, bare URLs as links, and indented blocks as code — then rewrites them in proper Markdown syntax.',
      'Each detection rule has its own checkbox — Headings, Lists, Links, and Code Blocks — so you stay in control: turn off link detection when pasting logs full of URLs, or disable code-block detection for indented prose. The conversion runs on the Exyconn server, where your text is processed in memory and never stored.',
      'It is the quickest way to structure meeting notes, README drafts, and text pasted out of emails or terminals without hand-placing every hash and asterisk yourself. Writers use it to bootstrap blog posts, developers to structure changelogs, and note-takers to feed clean Markdown into Obsidian or a team wiki. Copy the finished Markdown in one click or download it as a .md file.',
    ],
    features: [
      'Paste plain text or upload a .txt file',
      'Detects ALL-CAPS lines and converts them to headings',
      'Recognizes dash, asterisk, and numbered lines as lists',
      'Turns bare URLs into Markdown links',
      'Converts indented blocks into fenced code blocks',
      'Per-rule checkboxes to enable or disable each detection',
      'Text is converted in memory and never stored',
    ],
    useCases: [
      'Structure raw meeting notes into a shareable Markdown doc',
      'Turn a plain-text README draft into proper Markdown',
      'Convert text pasted from emails or terminals for a wiki',
      'Add link and list syntax to notes headed for Obsidian',
    ],
    howTo: [
      'Paste your plain text into the editor, or click Upload TXT.',
      'Tick the detection options you want: Headings, Lists, Links, Code Blocks.',
      'Click Convert to apply the selected rules.',
      'Copy the Markdown output or download it as a .md file.',
    ],
    faqs: [
      {
        question: 'How does heading detection work?',
        answer:
          'Lines written in ALL CAPS are treated as headings and converted to Markdown heading syntax. If your text uses capitals for emphasis instead, untick the Headings option.',
      },
      {
        question: 'Can I turn off individual detection rules?',
        answer:
          'Yes. Headings, Lists, Links, and Code Blocks each have their own checkbox, so you can apply only the rules that fit your text.',
      },
      {
        question: 'What counts as a list line?',
        answer:
          'Lines beginning with a dash, an asterisk, or a number followed by a period are converted to Markdown bullet or numbered list items.',
      },
      {
        question: 'How are code blocks detected?',
        answer:
          'Consistently indented blocks of lines are treated as code and wrapped in fenced code blocks. Disable the option if your text uses indentation for prose.',
      },
      {
        question: 'Is my text stored anywhere?',
        answer:
          'No. It is sent over HTTPS to the Exyconn server, converted in memory, and discarded once the Markdown is returned.',
      },
    ],
    keywords: [
      'text to markdown',
      'plain text to markdown',
      'convert text to markdown',
      'txt to md converter',
      'text to markdown online free',
      'notes to markdown',
      'auto format markdown',
    ],
    metaDescription:
      'Convert plain text to Markdown online for free. Auto-detects headings, lists, links, and code blocks — with a toggle for every rule.',
  },

  'xml-to-markdown': {
    longDescription: [
      'XML to Markdown converts XML documents into readable Markdown, mapping elements and their nesting into headings, lists, and formatted text a human can scan. Paste XML into the editor or upload an .xml file, click Convert, and the angle-bracket structure becomes documentation-ready output — repeated elements become list entries and element names label their content.',
      'The conversion runs on the Exyconn server: your XML is posted over HTTPS, transformed in memory, and returned without ever being stored, so configuration files and data exports are safe to convert. The monospace editor keeps the input legible, and the result lands in an output panel where you can review it before copying.',
      'It is useful for documenting SOAP payloads and RSS feeds, making legacy XML configuration files readable on a team wiki, and turning XML data exports into content for Markdown-based systems. Review the result in the output panel, then copy it with one click or download it as converted.md for your documentation.',
    ],
    features: [
      'Paste XML content or upload an .xml file',
      'Maps element nesting into Markdown structure',
      'Turns repeated elements into readable list entries',
      'Monospace editor for legible XML input',
      'One-click copy or download as converted.md',
      'XML is converted in memory and never stored',
    ],
    useCases: [
      'Document a SOAP or REST XML payload in a README',
      'Make a legacy XML config file readable on a team wiki',
      'Convert an RSS or sitemap feed into a scannable list',
      'Turn an XML data export into Markdown for a docs site',
    ],
    howTo: [
      'Paste your XML into the editor, or click Upload XML to load a file.',
      'Click Convert to transform the structure.',
      'Review the Markdown in the output panel.',
      'Copy the result or download it as converted.md.',
    ],
    faqs: [
      {
        question: 'How is the XML structure represented in Markdown?',
        answer:
          'Element names become labels and headings, nesting becomes indentation and sub-lists, and repeated sibling elements are rendered as list entries so records stay grouped.',
      },
      {
        question: 'What happens to XML attributes?',
        answer:
          'Attribute values are included alongside their element content, so identifiers like id or name are not lost in the conversion.',
      },
      {
        question: 'Does my XML need to be valid?',
        answer:
          'Yes — the document must be well-formed. Unclosed or mismatched tags cause the conversion to fail with an error, so fix those first.',
      },
      {
        question: 'Is my XML stored on your servers?',
        answer:
          'No. It is converted in memory on the Exyconn server and discarded as soon as the Markdown is returned.',
      },
      {
        question: 'Is this converter free?',
        answer: 'Yes, XML to Markdown conversion is completely free with no sign-up required.',
      },
    ],
    keywords: [
      'xml to markdown',
      'convert xml to markdown',
      'xml to md converter',
      'xml to readable text',
      'xml to markdown online free',
      'xml converter',
      'xml to markdown table',
    ],
    metaDescription:
      'Convert XML to readable Markdown online for free. Paste XML or upload a file and get structured headings and lists from your elements.',
  },
};
