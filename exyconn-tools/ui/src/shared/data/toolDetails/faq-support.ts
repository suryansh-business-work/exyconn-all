import type { ToolDetailsMap } from './types';

/** Detail content for the "faq-support" tool category. Keyed by tool id from toolsData. */
export const faqSupportToolDetails: ToolDetailsMap = {
  'website-faq-generator': {
    longDescription: [
      'The Website FAQ Generator turns any live website into a ready-to-publish FAQ section. Enter a URL and the tool scrapes the visible text from the site, then uses OpenAI GPT-4o-mini to write the number of question-and-answer pairs you choose — anywhere from 5 to 30 — in a professional, friendly, technical, or casual tone. The result appears as numbered Q&A pairs you can copy straight into your help center, FAQ page, or CMS.',
      'You bring your own OpenAI API key. The key is saved only in your browser’s local storage and is sent directly from your browser to OpenAI — it never passes through Exyconn’s servers. The only server-side step is fetching the website content, because browsers cannot scrape third-party sites directly. The first 8,000 characters of the scraped text are used as context, which keeps token costs low even on long pages, and the token count for each run is shown next to the result.',
      'It is built for site owners, support teams, and SEO specialists who want an FAQ section grounded in what a site actually says instead of generic boilerplate. Because every question is derived from real page content, the output doubles as raw material for FAQ schema markup, chatbot knowledge bases, and onboarding documentation.',
    ],
    features: [
      'Scrapes live website content automatically from a single URL',
      'Generates 5 to 30 FAQs per run — you pick the exact count',
      'Four writing tones: professional, friendly, technical, or casual',
      'Powered by OpenAI GPT-4o-mini using your own API key',
      'Displays token usage after every generation so you can track cost',
      'Numbered Q&A output ready to copy into any CMS or help desk',
      'API key stored only in your browser, never on Exyconn servers',
    ],
    useCases: [
      'Build the first FAQ page for a new product site without writing questions by hand',
      'Turn a client’s website into a question list during a content or SEO audit',
      'Seed a support chatbot’s knowledge base with questions taken from your own site',
      'Draft FAQ schema candidates to target Google’s FAQ rich results',
      'Create onboarding Q&A for a SaaS landing page before launch',
    ],
    howTo: [
      'Add your OpenAI API key in the API key panel — it is stored only in your browser',
      'Enter the full website URL, including https://',
      'Choose how many FAQs to generate (5–30) and pick a tone',
      'Click Generate FAQs and wait while the site is scraped and processed',
      'Copy the numbered Q&A pairs from the results panel into your site',
    ],
    faqs: [
      {
        question: 'Do I need my own OpenAI API key?',
        answer:
          'Yes. The tool calls OpenAI directly from your browser with your key, so you pay only OpenAI’s per-token price for what you generate. The Exyconn tool itself is free.',
      },
      {
        question: 'Is my API key or the scraped content stored anywhere?',
        answer:
          'Your key lives only in your browser’s local storage and goes straight to OpenAI. The website text is fetched by the Exyconn server purely to extract it and is not stored.',
      },
      {
        question: 'How much of the website is actually used?',
        answer:
          'The first 8,000 characters of the scraped text are sent as context. For most landing and product pages that covers everything; very long pages are truncated to control token cost.',
      },
      {
        question: 'Can it read pages behind a login?',
        answer:
          'No. The scraper can only fetch publicly accessible pages. For private content, copy the text into a document and use the DOCX or HTML FAQ generator instead.',
      },
      {
        question: 'Which AI model writes the FAQs?',
        answer:
          'OpenAI’s GPT-4o-mini, which balances quality and cost well for FAQ writing. A run of 10 FAQs typically costs a fraction of a cent in OpenAI tokens.',
      },
    ],
    keywords: [
      'website faq generator',
      'generate faq from website',
      'ai faq generator free',
      'faq generator from url',
      'create faq page from website',
      'faq schema generator',
      'website to faq converter',
      'ai faq maker online',
    ],
    metaDescription:
      'Free AI FAQ generator: enter any website URL and get 5–30 ready-to-publish FAQs in your chosen tone, powered by your own OpenAI key.',
  },
  'pdf-faq-generator': {
    longDescription: [
      'The PDF FAQ Generator converts the contents of a PDF document into a ready-made FAQ. Upload a PDF — a product manual, policy document, whitepaper, or course handout — and the tool extracts its text on the Exyconn server, then asks OpenAI GPT-4o-mini to write 5 to 30 question-and-answer pairs about it in the tone you select. The output arrives as numbered Q&A pairs you can paste into a help center, wiki, or training deck.',
      'Processing happens in two steps. Your PDF is uploaded to the Exyconn server only for text extraction (the same engine as the PDF-to-Markdown converter); the file is not kept after conversion. The extracted text — up to the first 8,000 characters — is then sent from your browser to OpenAI together with your own API key, which is stored only in your browser’s local storage. Token usage is displayed after each run so costs stay transparent.',
      'This tool suits support and documentation teams who publish manuals as PDFs but need searchable Q&A on the web, HR teams turning policy PDFs into employee FAQs, and educators condensing course readings into study questions. It saves the tedious step of re-reading a long document just to guess what people will ask about it.',
    ],
    features: [
      'Upload any PDF and get FAQs written about its actual content',
      'Server-side text extraction — no manual copy-pasting from the PDF',
      'Choose 5 to 30 FAQs per generation',
      'Professional, friendly, technical, or casual tone options',
      'Uses your own OpenAI API key with GPT-4o-mini',
      'Token usage shown after every run',
      'Uploaded files are processed for extraction only, not stored',
    ],
    useCases: [
      'Turn a product manual PDF into a customer-facing FAQ page',
      'Convert an HR policy document into an internal employee Q&A',
      'Summarize a whitepaper into questions prospects actually ask',
      'Create study questions from lecture notes or course PDFs',
      'Prepare a support team briefing from a new product spec sheet',
    ],
    howTo: [
      'Add your OpenAI API key in the API key panel',
      'Click Choose PDF File and select the document',
      'Pick the number of FAQs (5–30) and a tone',
      'Click Generate FAQs — the text is extracted, then the FAQs are written',
      'Copy the generated Q&A pairs from the results panel',
    ],
    faqs: [
      {
        question: 'What happens to my PDF after I upload it?',
        answer:
          'It is sent to the Exyconn server only to extract the text, and is not stored after the conversion completes. The extracted text then goes from your browser to OpenAI.',
      },
      {
        question: 'Does it work with scanned PDFs?',
        answer:
          'Only if the PDF contains selectable text. Pure image scans have no extractable text — run them through the OCR PDF tool first, then upload the OCR’d file here.',
      },
      {
        question: 'Is there a size or length limit?',
        answer:
          'The first 8,000 characters of extracted text are used as AI context — roughly 3–4 pages of dense text. Longer documents are truncated, so lead with the most important content.',
      },
      {
        question: 'Do I need an OpenAI account?',
        answer:
          'Yes, you need your own OpenAI API key. The tool is free; you only pay OpenAI for the tokens each generation uses, which is shown after every run.',
      },
      {
        question: 'Can I control how the questions sound?',
        answer:
          'Yes — pick professional, friendly, technical, or casual before generating. Technical works well for developer docs; friendly suits customer-facing help pages.',
      },
    ],
    keywords: [
      'pdf faq generator',
      'generate faq from pdf',
      'pdf to faq converter',
      'ai questions from pdf',
      'create faq from document',
      'pdf question generator',
      'manual to faq',
      'free ai faq generator',
    ],
    metaDescription:
      'Upload a PDF and get 5–30 AI-written FAQs about its content, free. Great for manuals, policies, and whitepapers. Uses your own OpenAI key.',
  },
  'webpage-faq-generator': {
    longDescription: [
      'The Webpage FAQ Generator writes an FAQ from one specific web page. Paste the URL of an article, docs page, pricing page, or blog post; the Exyconn server converts that page into clean Markdown — stripping navigation, scripts, and styling — and OpenAI GPT-4o-mini then writes 5 to 30 question-and-answer pairs about it in your chosen tone. Because the page is converted to structured Markdown first, the AI sees the actual article content rather than raw HTML noise.',
      'Your OpenAI API key stays in your browser’s local storage and is sent directly from the browser to OpenAI — Exyconn never sees it. The server touches only the page URL, fetching and converting it to Markdown on the fly without storing anything. Up to the first 8,000 characters of the converted content are used as AI context, and the exact token usage is reported with each result.',
      'Use it when you care about a single page rather than a whole site: turning a long-form guide into a Q&A summary, converting a docs article into help-desk macros, or generating the FAQ block that accompanies a blog post for FAQ schema. Content writers and support agents get grounded questions in seconds instead of skimming the page themselves.',
    ],
    features: [
      'Works on any single public web page — articles, docs, pricing pages',
      'Converts the page to clean Markdown before AI processing for better accuracy',
      'Generates 5 to 30 FAQs in one run',
      'Professional, friendly, technical, or casual tone',
      'Your own OpenAI API key, stored only in your browser',
      'Per-run token usage display',
      'Nothing is stored server-side — pages are converted on the fly',
    ],
    useCases: [
      'Add an FAQ block with schema markup under a blog post',
      'Turn a documentation article into ready-made support macros',
      'Summarize a long-form guide into a Q&A digest for a newsletter',
      'Generate objection-handling questions from a competitor’s pricing page',
      'Build course discussion questions from an online article',
    ],
    howTo: [
      'Add your OpenAI API key in the API key panel',
      'Paste the full URL of the page, e.g. https://example.com/about',
      'Select the number of FAQs (5–30) and a tone',
      'Click Generate FAQs and wait for conversion and generation to finish',
      'Copy the numbered Q&A pairs from the results panel',
    ],
    faqs: [
      {
        question: 'How is this different from the Website FAQ Generator?',
        answer:
          'This tool converts one specific page to clean Markdown before generating, which suits article-style pages. The Website FAQ Generator scrapes a site’s rendered text, which suits landing pages.',
      },
      {
        question: 'Can it process pages that require a login?',
        answer:
          'No — the server can only fetch publicly reachable URLs. Save the page as HTML and use the HTML FAQ Generator for private content.',
      },
      {
        question: 'Is the page content stored anywhere?',
        answer:
          'No. The page is fetched and converted to Markdown in memory, and only up to 8,000 characters are forwarded from your browser to OpenAI with your own key.',
      },
      {
        question: 'What does a generation cost?',
        answer:
          'The tool is free. You pay only OpenAI’s token price via your own API key — GPT-4o-mini makes a 10-FAQ run cost well under a cent, and usage is shown after each run.',
      },
      {
        question: 'Can I regenerate with different settings?',
        answer:
          'Yes. Change the count or tone and click Generate FAQs again — each run is independent, so you can compare a technical version against a friendly one.',
      },
    ],
    keywords: [
      'webpage faq generator',
      'generate faq from url',
      'article to faq',
      'faq from blog post',
      'ai faq generator from link',
      'url to questions generator',
      'faq schema from page',
      'free faq generator online',
    ],
    metaDescription:
      'Paste any page URL and get 5–30 AI-generated FAQs from its content, free. Clean Markdown extraction, four tones, your own OpenAI key.',
  },
  'docx-faq-generator': {
    longDescription: [
      'The DOCX FAQ Generator builds a question-and-answer set from a Microsoft Word document. Upload a .docx file — an internal policy, a product spec, training material, or a client brief — and the Exyconn server converts it to Markdown, preserving headings and structure. OpenAI GPT-4o-mini then writes 5 to 30 FAQs about the document in the tone you pick, returned as numbered Q&A pairs ready to copy anywhere.',
      'The document is uploaded only for text extraction and is not stored after conversion. Everything AI-related happens with your own OpenAI API key, which lives in your browser’s local storage and travels straight from your browser to OpenAI. Up to the first 8,000 characters of the converted document are used as context, and each run reports its exact token usage so you always know what it cost.',
      'It is aimed at teams whose source of truth lives in Word: HR departments publishing policy FAQs, operations teams turning SOPs into quick-reference Q&A, and consultants converting deliverables into client-facing FAQ sections. Instead of re-reading a 20-page document to anticipate questions, you get a grounded first draft in under a minute.',
    ],
    features: [
      'Accepts .docx files directly — no copy-pasting from Word',
      'Structure-aware extraction keeps headings and lists intact',
      'Generates 5 to 30 FAQs per run',
      'Professional, friendly, technical, or casual tone',
      'Runs on your own OpenAI API key with GPT-4o-mini',
      'Token usage shown after every generation',
      'Documents are converted in memory and not stored',
    ],
    useCases: [
      'Turn an HR policy document into an employee-facing FAQ',
      'Convert a standard operating procedure into onboarding Q&A',
      'Create a client FAQ from a project proposal or deliverable',
      'Build training quiz questions from internal course material',
      'Draft a press FAQ from a product announcement document',
    ],
    howTo: [
      'Add your OpenAI API key in the API key panel',
      'Click Choose DOCX File and select your Word document',
      'Pick the number of FAQs (5–30) and a tone',
      'Click Generate FAQs — the text is extracted, then the Q&A is written',
      'Copy the generated FAQs from the results panel',
    ],
    faqs: [
      {
        question: 'Is my Word document stored on your servers?',
        answer:
          'No. The file is uploaded solely so the server can extract its text, and it is not retained after the conversion finishes.',
      },
      {
        question: 'Does it support .doc files or only .docx?',
        answer:
          'Only the modern .docx format. If you have a legacy .doc file, open it in Word or LibreOffice and save it as .docx first.',
      },
      {
        question: 'How long a document can it handle?',
        answer:
          'The first 8,000 characters of extracted text — roughly 3–4 pages — are used as AI context. For longer documents, put the key content first or split it into sections.',
      },
      {
        question: 'Do tables and images in the document get used?',
        answer:
          'Text in tables is extracted along with the rest of the document. Images are ignored, since only the textual content is sent to the AI.',
      },
      {
        question: 'What do I pay to use it?',
        answer:
          'The tool is free. Generation runs on your own OpenAI API key, so you only pay OpenAI per token — a typical run costs a fraction of a cent, shown after each generation.',
      },
    ],
    keywords: [
      'docx faq generator',
      'generate faq from word document',
      'word to faq converter',
      'ai questions from docx',
      'faq from word file',
      'document faq generator free',
      'policy document to faq',
      'sop to faq generator',
    ],
    metaDescription:
      'Upload a Word .docx and get 5–30 AI-written FAQs from its content, free. Ideal for policies, SOPs, and specs. Uses your own OpenAI key.',
  },
  'html-faq-generator': {
    longDescription: [
      'The HTML FAQ Generator writes FAQs from raw HTML — either a .html/.htm file you upload or markup you paste straight into the text box. The Exyconn server strips the tags and converts the markup to clean Markdown so the AI reads real content instead of angle brackets, then OpenAI GPT-4o-mini generates 5 to 30 question-and-answer pairs in your chosen tone. The output is a numbered Q&A list you can drop back into your page.',
      'This is the FAQ generator for content that is not (or not yet) online: static site exports, email templates, CMS drafts, intranet pages, or archived pages saved to disk. Because you supply the markup yourself, it also works for content behind a login that the URL-based generators cannot reach — save the page as HTML from your browser and upload it here.',
      'Your OpenAI API key is stored only in your browser’s local storage and is sent directly from your browser to OpenAI. The HTML you provide is sent to the Exyconn server only for the tag-stripping conversion and is not stored. Up to the first 8,000 characters of the cleaned content are used as context, and token usage is displayed with every result.',
    ],
    features: [
      'Upload a .html/.htm file or paste raw markup directly',
      'Server-side tag stripping converts HTML to clean Markdown before AI',
      'Works on offline, draft, and login-protected content you save yourself',
      'Generates 5 to 30 FAQs per run in four tones',
      'Powered by GPT-4o-mini via your own OpenAI API key',
      'Token usage shown after each generation',
      'Nothing you submit is stored on Exyconn servers',
    ],
    useCases: [
      'Generate an FAQ for a static site page before it goes live',
      'Save a login-protected page as HTML and build FAQs from it',
      'Turn an HTML email or newsletter template into a Q&A digest',
      'Create FAQs from an archived or legacy page that is no longer online',
      'Draft help content from a CMS preview export during a site rebuild',
    ],
    howTo: [
      'Add your OpenAI API key in the API key panel',
      'Upload an HTML file, or paste the markup into the text field',
      'Choose the number of FAQs (5–30) and a tone',
      'Click Generate FAQs and wait for parsing and generation',
      'Copy the numbered Q&A pairs from the results panel',
    ],
    faqs: [
      {
        question: 'Do I have to clean up the HTML first?',
        answer:
          'No. The server converts your markup to Markdown, discarding tags, scripts, and styles automatically, so you can paste a full page source as-is.',
      },
      {
        question: 'Can I use this for pages that require a login?',
        answer:
          'Yes — that is its main advantage over the URL-based generators. Open the page while logged in, save it with Ctrl+S as HTML, and upload the saved file here.',
      },
      {
        question: 'Is the HTML I paste stored anywhere?',
        answer:
          'No. It is sent to the Exyconn server only for conversion to Markdown and is processed in memory. The cleaned text then goes from your browser to OpenAI with your key.',
      },
      {
        question: 'How much content does it read?',
        answer:
          'Up to the first 8,000 characters after conversion. Very long pages are truncated, so trim boilerplate like footers before pasting if the key content sits low on the page.',
      },
      {
        question: 'Is it free to use?',
        answer:
          'Yes — the tool is free. You supply your own OpenAI API key and pay only OpenAI’s per-token price, which the tool reports after every run.',
      },
    ],
    keywords: [
      'html faq generator',
      'generate faq from html',
      'html to faq converter',
      'faq from html file',
      'ai faq generator paste html',
      'static site faq generator',
      'html content to questions',
      'free faq generator',
    ],
    metaDescription:
      'Free AI FAQ generator for HTML: upload a file or paste markup and get 5–30 FAQs from the content. Works offline-saved and draft pages too.',
  },
  'google-docs-faq-generator': {
    longDescription: [
      'The Google Docs FAQ Generator creates an FAQ directly from a Google Docs link — no download, export, or copy-paste needed. Paste the sharing URL of a doc, and the Exyconn server fetches it and converts it to Markdown; OpenAI GPT-4o-mini then writes 5 to 30 question-and-answer pairs about the document in the tone you choose. The result is a numbered Q&A list you can paste back into the doc, a wiki, or a help center.',
      'The document must be shared so that anyone with the link can view it — the server reads it the same way a browser would, without signing in to your Google account, so no Google login or OAuth permission is ever requested. The doc content is converted in memory and not stored; up to the first 8,000 characters are used as AI context. Your OpenAI API key stays in your browser’s local storage and is sent only to OpenAI.',
      'It fits teams that draft everything in Google Docs: product managers turning spec docs into stakeholder FAQs, marketers converting campaign briefs into client Q&A, and support leads distilling internal runbooks into agent-facing quick answers — all without breaking the Docs-centered workflow to export files.',
    ],
    features: [
      'Works from a Google Docs share link — no export or download step',
      'No Google sign-in required; the doc is read via its public link',
      'Generates 5 to 30 FAQs per run',
      'Professional, friendly, technical, or casual tone',
      'Uses your own OpenAI API key with GPT-4o-mini',
      'Token usage displayed after each run',
      'Document content is converted in memory, never stored',
    ],
    useCases: [
      'Turn a product spec doc into an FAQ for stakeholders',
      'Convert a campaign brief into client-ready Q&A',
      'Distill a team runbook into quick answers for support agents',
      'Create study questions from lecture notes kept in Google Docs',
      'Draft a public FAQ from a policy doc without exporting it',
    ],
    howTo: [
      'In Google Docs, set sharing to “Anyone with the link” (Viewer is enough)',
      'Add your OpenAI API key in the API key panel',
      'Paste the document URL (https://docs.google.com/document/d/...)',
      'Choose the number of FAQs (5–30) and a tone, then click Generate FAQs',
      'Copy the generated Q&A pairs from the results panel',
    ],
    faqs: [
      {
        question: 'Does the tool need access to my Google account?',
        answer:
          'No. It never asks you to sign in to Google. The server reads the document through its share link, exactly as any visitor with the link would.',
      },
      {
        question: 'Why does it say it cannot fetch my document?',
        answer:
          'Almost always because the doc is restricted. Open Share settings and change access to “Anyone with the link”. Docs restricted to specific people cannot be read.',
      },
      {
        question: 'Is my document content stored anywhere?',
        answer:
          'No. The doc is fetched and converted to Markdown in memory; up to 8,000 characters are then sent from your browser to OpenAI using your own API key.',
      },
      {
        question: 'Does it work with Google Sheets or Slides?',
        answer:
          'No, only Google Docs documents. For spreadsheets or slides, paste the relevant text into a doc or use the HTML FAQ Generator with exported content.',
      },
      {
        question: 'What does it cost?',
        answer:
          'The tool is free. You bring your own OpenAI API key and pay only OpenAI’s token price — typically well under a cent per run, shown after each generation.',
      },
    ],
    keywords: [
      'google docs faq generator',
      'generate faq from google doc',
      'google doc to faq',
      'ai questions from google docs',
      'faq from google docs link',
      'google docs question generator',
      'free faq generator google docs',
      'convert google doc to faq',
    ],
    metaDescription:
      'Paste a Google Docs link and get 5–30 AI-written FAQs from the document, free. No Google sign-in, no export — just share the link.',
  },
  'notion-faq-generator': {
    longDescription: [
      'The Notion FAQ Generator turns a public Notion page into a ready-made FAQ. Paste the page’s public URL, and the Exyconn server fetches it and converts the blocks to Markdown; OpenAI GPT-4o-mini then writes 5 to 30 question-and-answer pairs about the content in your chosen tone. The result comes back as numbered Q&A pairs you can paste into the same Notion page, a help center, or a public docs site.',
      'The page must be shared to the web — in Notion, open Share and enable “Publish to web” (or make the page public). The server reads the published page without any Notion login or API integration token, so nothing about your workspace is exposed beyond the page you deliberately publish. The content is converted in memory and not stored; the first 8,000 characters are used as AI context.',
      'As with every Exyconn AI tool, you use your own OpenAI API key. It is kept only in your browser’s local storage and travels directly from the browser to OpenAI, with token usage reported after each run. Teams that keep their docs, wikis, and product notes in Notion can generate grounded FAQ drafts without exporting anything.',
    ],
    features: [
      'Works from any public Notion page URL — no export needed',
      'No Notion login or integration token required',
      'Notion blocks converted to clean Markdown before AI processing',
      'Generates 5 to 30 FAQs in professional, friendly, technical, or casual tone',
      'Runs on your own OpenAI API key with GPT-4o-mini',
      'Per-run token usage display',
      'Page content is processed in memory and never stored',
    ],
    useCases: [
      'Turn a Notion product wiki page into a customer-facing FAQ',
      'Convert internal onboarding notes into a new-hire Q&A page',
      'Create a public FAQ from a Notion changelog or roadmap page',
      'Distill meeting notes or a project brief into stakeholder questions',
      'Draft help-center articles from a Notion knowledge base page',
    ],
    howTo: [
      'In Notion, open Share on the page and enable public web access',
      'Add your OpenAI API key in the API key panel',
      'Paste the Notion page URL (https://notion.so/... or your custom domain)',
      'Choose the number of FAQs (5–30) and a tone, then click Generate FAQs',
      'Copy the numbered Q&A pairs from the results panel',
    ],
    faqs: [
      {
        question: 'Why can’t the tool read my Notion page?',
        answer:
          'The page must be published to the web. Private and workspace-only pages are not reachable — open Share in Notion and enable public access, then try again.',
      },
      {
        question: 'Do I need to connect my Notion account or create an integration?',
        answer:
          'No. The server reads the page through its public URL like any visitor would, so no Notion login, OAuth, or API token is involved.',
      },
      {
        question: 'Does it read sub-pages and linked databases?',
        answer:
          'No, only the single page at the URL you paste. Generate separately for each sub-page, or consolidate the content onto one page first.',
      },
      {
        question: 'Is the page content stored by Exyconn?',
        answer:
          'No. It is fetched and converted to Markdown in memory; up to 8,000 characters are then sent from your browser to OpenAI using your own key.',
      },
      {
        question: 'What does a generation cost?',
        answer:
          'The tool is free. You pay only OpenAI’s per-token price through your own API key — GPT-4o-mini keeps a typical run under a cent, and usage is shown after each result.',
      },
    ],
    keywords: [
      'notion faq generator',
      'generate faq from notion page',
      'notion to faq',
      'ai questions from notion',
      'notion page to q&a',
      'notion wiki faq generator',
      'free faq generator notion',
      'convert notion page to faq',
    ],
    metaDescription:
      'Paste a public Notion page URL and get 5–30 AI-generated FAQs from its content, free. No Notion login or export — publish, paste, generate.',
  },
  'support-script-generator': {
    longDescription: [
      'The Customer Support Script Generator writes complete, structured support scripts from a short brief. Describe the support topic (returns, billing issues, outage handling), name your industry, pick a tone — professional, friendly, empathetic, or formal — and optionally list specific customer scenarios. OpenAI GPT-4o-mini then produces a full script: greeting and opening statements, response templates for common issues, troubleshooting steps, escalation procedures, closing statements, and sample dialogues.',
      'Unlike the FAQ generators in this category, nothing is uploaded or scraped — the script is generated entirely from the details you type into the form. Your OpenAI API key is stored only in your browser’s local storage and is sent directly from your browser to OpenAI; Exyconn’s servers are not involved in the generation at all. Token usage for each run is shown beside the result so costs stay visible.',
      'It is built for support team leads standing up a new queue, founders writing their first help-desk playbook, call-center trainers preparing role-play material, and agencies drafting client-specific scripts. The scenario field is the key to quality: the more concrete situations you describe, the more the sample dialogues read like your actual customers.',
    ],
    features: [
      'Generates a full script: greetings, responses, troubleshooting, escalation, closings',
      'Includes sample dialogues for the key scenarios you describe',
      'Four tones: professional, friendly, empathetic, or formal',
      'Free-text industry field tailors language to your sector',
      'Optional scenario field for company-specific situations',
      'Powered by GPT-4o-mini via your own OpenAI API key',
      'Fully browser-to-OpenAI — no data passes through Exyconn servers',
    ],
    useCases: [
      'Write the opening playbook for a brand-new support team',
      'Standardize how agents handle refunds and billing disputes',
      'Prepare role-play scripts for call-center training sessions',
      'Draft an incident-communication script before a product launch',
      'Give outsourced or seasonal agents a consistent voice quickly',
    ],
    howTo: [
      'Add your OpenAI API key in the API key panel',
      'Enter the support topic, e.g. “product returns” or “billing issues”',
      'Name your industry, such as e-commerce, SaaS, or healthcare',
      'Pick a tone and optionally describe specific customer scenarios',
      'Click Generate Support Script and copy the result from the panel',
    ],
    faqs: [
      {
        question: 'What exactly does the generated script contain?',
        answer:
          'Greeting and opening lines, response templates for common issues, numbered troubleshooting steps, escalation procedures, closing statements with follow-up actions, and sample dialogues.',
      },
      {
        question: 'How do I make the script fit my company?',
        answer:
          'Use the optional scenarios field. Describing concrete situations — “customer’s order arrived damaged”, “user locked out after a password reset” — makes the dialogues far more specific.',
      },
      {
        question: 'Is anything I type stored or sent to Exyconn?',
        answer:
          'No. This tool has no upload or server step: your brief goes straight from your browser to OpenAI using your own API key, which lives only in your browser’s local storage.',
      },
      {
        question: 'Which tone should I choose?',
        answer:
          'Empathetic works best for complaints and refunds, friendly for consumer products, professional for B2B, and formal for regulated industries like finance or healthcare.',
      },
      {
        question: 'Is the tool really free?',
        answer:
          'Yes — the tool itself costs nothing. You bring your own OpenAI API key and pay only OpenAI’s token price per generation, which is displayed after each run.',
      },
      {
        question: 'Can I generate scripts for multiple topics?',
        answer:
          'Yes. Run the form once per topic — returns, billing, technical issues — and combine the results into a playbook. Each run is independent.',
      },
    ],
    keywords: [
      'customer support script generator',
      'call center script generator',
      'ai support script writer',
      'customer service script template',
      'help desk script generator free',
      'support agent script maker',
      'escalation script generator',
      'customer service dialogue generator',
    ],
    metaDescription:
      'Free AI support script generator: enter a topic, industry, and tone to get a full script with greetings, troubleshooting, escalations, and dialogues.',
  },
};
