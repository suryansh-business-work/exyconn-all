import type { ToolDetailsMap } from './types';

/** Detail content for the "business-utility" tool category. Keyed by tool id from toolsData. */
export const businessUtilityToolDetails: ToolDetailsMap = {
  'logo-set': {
    longDescription: [
      'Logo Set turns a single logo upload into a complete, production-ready icon package. Drop in one image and the tool renders it at every size a modern brand needs: browser favicons at 16, 32, and 48 pixels, web app and PWA icons at 192, 512, and 1024 pixels, full-size logos, and more than fifteen Android and iOS splash screens covering everything from mdpi phones to 12.9-inch iPads.',
      'Every size is editable on its own canvas. Set a background color or keep transparency, adjust padding, crop to any aspect ratio, erase stray pixels, and fine-tune brightness, contrast, and saturation — applied globally or to a single size. An undo/redo history tracks each change, and a custom sizes dialog lets you add any width and height the built-in presets do not cover.',
      'All resizing and rendering happens client-side in your browser, so your artwork never leaves your machine for standard exports. The one exception is the optional background removal step, which sends the image to the Exyconn server for AI processing (or to remove.bg if you select that provider with your own API key). Export each asset as PNG, JPG, WebP, or ICO, or grab the entire set with one Download All click.',
    ],
    features: [
      'Generates favicons (16-48px), app icons (192/512/1024px), logos, and 15+ Android and iOS splash screen sizes from one upload',
      'Per-size or global controls for background color, transparency, padding, and image adjustments',
      'Built-in crop tool with aspect-ratio presets, zoom, and rotation',
      'Pixel erase tool plus AI background removal via the Exyconn server or your own remove.bg key',
      'Export as PNG, JPG, WebP, or ICO — individually or all at once',
      'Custom sizes dialog for any width and height beyond the presets',
      'Full undo/redo history for every edit',
      'Resizing runs client-side in your browser; standard exports never upload your image',
    ],
    useCases: [
      'Ship a new web app with correct favicon and PWA icon sizes in minutes',
      'Prepare every Android and iOS splash screen for a mobile app release',
      'Regenerate the full icon set after a logo refresh or rebrand',
      'Remove the background from a client logo and pad it onto a brand color',
      'Produce a separate icon pack for each customer of a white-label product',
    ],
    howTo: [
      'Upload your logo — a square PNG with transparency works best',
      'Pick the sizes you need (all favicons, icons, or splash screens) and add custom sizes if required',
      'Adjust background, padding, and image settings globally, or open a single size to fine-tune it',
      'Optionally crop the source image, erase stray pixels, or remove the background',
      'Choose an export format (PNG, JPG, WebP, or ICO) and click Download All',
    ],
    faqs: [
      {
        question: 'Does my logo get uploaded to a server?',
        answer:
          'Not for normal use — cropping, resizing, and exporting all run in your browser. Only the optional background removal feature uploads the image, either to the Exyconn server or to remove.bg with your own API key, and only to process that one request.',
      },
      {
        question: 'Which sizes does it generate?',
        answer:
          'Favicons at 16, 32, and 48 pixels; app icons at 192, 512, and 1024 pixels; logos at 512 and 1024 pixels; and Android (mdpi through xxxhdpi) plus iOS (iPhone SE through 14 Pro Max and iPads) splash screens. You can also add any custom width and height.',
      },
      {
        question: 'Can I export a .ico file for my website favicon?',
        answer:
          'Yes. Switch the export format to ICO and download the favicon sizes — the file works as a classic favicon.ico for any website.',
      },
      {
        question: 'Can each size have different settings?',
        answer:
          'Yes. Global settings apply to every size at once, but you can open any individual size and override its background, padding, and adjustments without affecting the rest.',
      },
      {
        question: 'Do I need design software first?',
        answer:
          'No. A single reasonably sized export of your logo is enough — the tool handles cropping, padding, background changes, and all the resizing itself.',
      },
    ],
    keywords: [
      'favicon generator',
      'app icon generator',
      'logo resizer',
      'splash screen generator',
      'pwa icon sizes',
      'generate favicon from logo',
      'android app icon sizes',
      'ios splash screen generator',
      'ico converter',
      'logo size pack',
    ],
    metaDescription:
      'Free Logo Set tool: turn one logo into favicons, app icons, and iOS/Android splash screens in your browser. Edit each size and download all at once.',
  },
  'email-signature': {
    longDescription: [
      'The Email Signature Generator builds a polished HTML signature from a simple tabbed form. Fill in your name, role, and contact details, add your company logo and a profile photo, link your social profiles, and attach a call-to-action button or a legal disclaimer. A live preview updates with every keystroke, so you always see exactly what recipients will get before you commit.',
      'The Design tab controls the look: pick a layout template, switch themes, and set your brand colors and fonts. Custom fields cover anything the standard form misses — a booking link, an office number, a certification. Logo and photo can be uploaded (they are hosted on the Exyconn server so they display in recipients’ inboxes) or referenced by URL if you already host them.',
      'Your entries autosave to browser storage, so you can close the tab and pick up where you left off. When you are happy, copy the signature as rich text and paste it straight into Gmail, Outlook, or Apple Mail, copy the raw HTML for signature managers and CRMs, or send yourself a test email to check it in a real inbox.',
    ],
    features: [
      'Six-tab editor: personal info, branding, social links, custom fields, CTA and disclaimer, and design',
      'Live preview that updates as you type',
      'Layout templates with theme, brand color, and font controls',
      'One-click copy as rich text (paste into Gmail or Outlook) or as raw HTML code',
      'Send a test email to see the signature in a real inbox',
      'Logo and photo by upload or by URL',
      'Autosaves your draft to browser storage so nothing is lost between visits',
    ],
    useCases: [
      'Set up a professional signature on your first day at a new company',
      'Roll out one consistent branded signature across a sales team',
      'Add a meeting-booking CTA button under your contact details',
      'Include the legal disclaimer your compliance team requires',
      'Refresh every detail after a promotion or company rebrand',
    ],
    howTo: [
      'Enter your name, job title, and contact details in the Info tab',
      'Add your logo and photo under Branding and your profiles under Social',
      'Optionally add custom fields, a CTA button, or a disclaimer',
      'Style the signature in the Design tab — template, theme, colors, and fonts — while watching the live preview',
      'Click Copy Rich Text and paste it into your email client’s signature settings, or copy the HTML for tools that accept code',
    ],
    faqs: [
      {
        question: 'How do I add the signature to Gmail?',
        answer:
          'Click Copy Rich Text, then in Gmail open Settings > See all settings > Signature, create a new signature, and paste. The formatting, images, and links carry over.',
      },
      {
        question: 'Will it render correctly in Outlook?',
        answer:
          'Yes. The generator produces table-based HTML, the layout technique that renders consistently across Outlook, Gmail, Apple Mail, and most other clients.',
      },
      {
        question: 'Is my information sent anywhere?',
        answer:
          'Form data stays in your browser and autosaves to local storage on your device. Uploaded logo and photo files are stored on the Exyconn server so they can display in recipients’ inboxes, and the optional test email sends the finished signature to the address you specify.',
      },
      {
        question: 'Rich text or HTML — which copy button should I use?',
        answer:
          'Use Copy Rich Text to paste directly into an email client’s signature editor. Use Copy HTML when a tool asks for code, such as a CRM, a helpdesk, or a company-wide signature manager.',
      },
      {
        question: 'Can I come back and edit it later?',
        answer:
          'Yes. Your draft autosaves to browser storage, so reopening the tool on the same device and browser restores everything you entered.',
      },
    ],
    keywords: [
      'email signature generator',
      'free email signature',
      'html email signature',
      'gmail signature maker',
      'outlook signature generator',
      'professional email signature with logo',
      'email signature with social icons',
      'company email signature template',
    ],
    metaDescription:
      'Create a professional email signature free with live preview, templates, logo, social links, and CTA — copy it into Gmail, Outlook, or Apple Mail in seconds.',
  },
  'lead-generator': {
    longDescription: [
      'The Lead Generator finds registered businesses inside an exact geographic area you define. Instead of searching a whole city, you draw a polygon directly on a Google Map — a retail strip, an industrial estate, a handful of blocks — and the tool queries the Google Places API for matching businesses within that boundary, up to a result limit you control from 10 to 1000.',
      'A guided stepper walks you through the search: set a starting location, draw your area on the map, then pick business categories or type a free-text query and run the search. Results appear as pins on the map and in a detail list showing each business’s name, address, and rating, with an info window on the map for whichever business you select.',
      'Searches run in your browser directly against Google’s API using your own Google Maps and Places keys, entered once in the API settings panel and stored only in your browser’s local storage — they are never sent to Exyconn. That makes it a practical prospecting tool for agencies, local-service sales teams, and anyone building a territory-based outreach list.',
    ],
    features: [
      'Draw a freehand polygon on Google Maps to define the exact search area',
      'Guided step-by-step flow: location, draw area, category, search',
      'Filter by business categories or a free-text query',
      'Adjustable result limit from 10 up to 1000 businesses',
      'Synced results — click a business in the list to highlight its pin, or a pin to see its details',
      'Uses your own Google API keys, stored only in your browser’s local storage',
    ],
    useCases: [
      'Build a prospect list of restaurants inside a specific delivery zone',
      'Map every dental clinic in a territory before opening a new practice',
      'Collect businesses along a planned door-to-door sales route',
      'Audit competitors within a few blocks of a client’s storefront',
      'Scope local partners for a neighborhood marketing campaign',
    ],
    howTo: [
      'Open the API settings panel and paste your Google Maps and Google Places API keys',
      'Set a starting location so the map centers on your target area',
      'Click Draw Area and click points on the map to outline your polygon',
      'Choose business categories or type a search query, and set the maximum results',
      'Run the search and browse the businesses in the list or on the map',
    ],
    faqs: [
      {
        question: 'Do I need my own Google API key?',
        answer:
          'Yes. Create a key in the Google Cloud console with the Maps JavaScript API and Places API enabled. Google’s free monthly credit typically covers moderate prospecting use.',
      },
      {
        question: 'Are my API keys stored or shared?',
        answer:
          'They are saved only in your browser’s local storage and used from your browser to call Google directly. They are never transmitted to or stored on Exyconn servers.',
      },
      {
        question: 'How accurate is the polygon boundary?',
        answer:
          'The search radius is derived from the polygon you draw, so results concentrate inside your area. Because Google’s nearby search is radius-based, an occasional result just outside an irregular polygon’s edge can appear.',
      },
      {
        question: 'What details do I get for each business?',
        answer:
          'The name, address, and rating that Google Places returns for the listing, shown in the results list and in the map info window when you select a business.',
      },
      {
        question: 'How many results can one search return?',
        answer:
          'You set the limit yourself with the Maximum Results slider, anywhere from 10 to 1000. Larger limits take longer because Google returns results in pages.',
      },
    ],
    keywords: [
      'lead generator map',
      'find businesses in an area',
      'google maps business search',
      'local business leads',
      'b2b lead generation tool',
      'draw polygon business search',
      'sales territory mapping',
      'google places lead finder',
    ],
    metaDescription:
      'Free lead generator: draw an area on Google Maps and find every registered business inside it. Uses your own Google API keys, stored only in your browser.',
  },
  'contact-extractor': {
    longDescription: [
      'Contact Extractor crawls any public website and pulls out the contact details scattered across its pages: email addresses, phone numbers, physical addresses, and links to social profiles. Point it at a homepage and the Exyconn server fetches the site, optionally follows internal links on the same domain, and scans up to 50 pages in a single run — no browser extension or script required.',
      'Three extraction modes fit different jobs. Extract Pages Only maps the site’s structure, Extract Contacts pulls emails, phone numbers, and addresses, and Extract All combines both. Results are grouped per page so you can see exactly where each contact was found, alongside a summary of the unique emails, phones, and social links discovered across the whole crawl.',
      'When the crawl finishes, export everything as a CSV ready for your CRM or spreadsheet, or as JSON for programmatic use — every row records the type, the value, and the source page. It suits sales teams enriching lead lists, recruiters sourcing contacts, and site owners auditing which details their own site exposes. Only crawl public sites you are permitted to contact.',
    ],
    features: [
      'Extracts email addresses, phone numbers, physical addresses, and social profile links',
      'Crawls 1 to 50 pages per run, with an option to follow internal links on the same domain',
      'Three modes: pages only, contacts only, or pages plus contacts together',
      'Per-page breakdown showing exactly where each contact was found',
      'Summary of unique emails, phones, and social links across the whole site',
      'One-click CSV and JSON export with source-page attribution on every row',
      'Crawling runs on the Exyconn server, so big scans never freeze your browser',
    ],
    useCases: [
      'Enrich a lead list with direct emails from prospects’ websites',
      'Collect phone numbers for a local-business outreach campaign',
      'Audit which email addresses and numbers your own site exposes publicly',
      'Gather social profiles for a partner or influencer outreach list',
      'Map a site’s page structure before a content or SEO project',
    ],
    howTo: [
      'Paste the website URL you want to scan',
      'Set the Max Pages slider (1-50) and toggle Follow internal links on or off',
      'Choose an extraction type: Pages Only, Contacts, or Extract All',
      'Review the summary and the per-page details in the results panel',
      'Export the contacts as CSV for a spreadsheet or JSON for code',
    ],
    faqs: [
      {
        question: 'Where does the crawling happen — is my data stored?',
        answer:
          'The Exyconn server fetches the pages and returns the extracted results straight to your browser. Crawled pages are processed per request, not archived, and you download the results yourself as CSV or JSON.',
      },
      {
        question: 'How many pages can it scan at once?',
        answer:
          'Up to 50 pages per run. With Follow internal links enabled it discovers additional pages on the same domain automatically; more pages find more contacts but take longer.',
      },
      {
        question: 'Why did it find no email addresses on a site?',
        answer:
          'Some sites obfuscate emails, render them with JavaScript, or only offer a contact form. The extractor reads the served HTML, so details hidden behind scripts or forms may not appear.',
      },
      {
        question: 'Is it legal to extract contacts from websites?',
        answer:
          'The tool only reads publicly available pages, but you are responsible for complying with each site’s terms and with outreach laws such as GDPR and CAN-SPAM before contacting anyone you find.',
      },
      {
        question: 'Can it extract contacts from social media or login-protected pages?',
        answer:
          'No. It is built for public business websites; pages that require a login or sit behind a paywall cannot be crawled.',
      },
    ],
    keywords: [
      'contact extractor',
      'email extractor from website',
      'extract phone numbers from website',
      'website email scraper',
      'find email addresses on a website',
      'extract contacts to csv',
      'social link extractor',
      'lead enrichment tool',
    ],
    metaDescription:
      'Free contact extractor: crawl any website for emails, phone numbers, and social links across up to 50 pages, then export the results to CSV or JSON.',
  },
  'chatbot-roi-calculator': {
    longDescription: [
      'The Chatbot ROI Calculator puts a number on what AI-assisted support could save your business. Move four sliders — agent cost per hour, monthly ticket volume, average resolution time, and the percentage of tickets you want automated — and the calculator projects the annual impact of letting Smart Exy Bot, Exyconn’s AI chat solution, handle the routine conversations.',
      'Results update in real time as you drag: total dollar savings per year, agent hours reclaimed, the Smart Exy Bot cost at your volume, and the resulting net annual ROI. Because the math runs entirely in your browser with no submit button and no signup, you can test scenarios freely — a conservative 25% automation rate against an aggressive 75% — and watch the business case shift.',
      'It is built for support leaders sizing an AI investment, founders weighing another support hire against automation, and agencies preparing chatbot proposals for clients. A Reset button returns the sliders to sensible defaults, so producing a fresh estimate for a different team or client takes seconds.',
    ],
    features: [
      'Four-slider model: agent hourly cost, tickets per month, resolution time, and automation percentage',
      'Real-time recalculation as you drag — no submit button',
      'Projects annual dollar savings, agent hours saved, bot cost, and net ROI',
      'Reset button to return every input to its default',
      'Runs 100% client-side; nothing you enter is sent or stored',
    ],
    useCases: [
      'Build the business case for adding an AI chatbot to your support stack',
      'Compare the cost of hiring another agent against automating routine tickets',
      'Test conservative and aggressive automation scenarios before a vendor call',
      'Add concrete ROI figures to a client proposal for a chatbot rollout',
    ],
    howTo: [
      'Set what one support agent costs you per hour',
      'Enter how many tickets your team handles each month',
      'Set the average minutes it takes to resolve one ticket',
      'Choose the percentage of tickets you want AI to resolve automatically',
      'Read your projected annual savings, hours saved, and net ROI in the results panel',
    ],
    faqs: [
      {
        question: 'How are the savings calculated?',
        answer:
          'Monthly tickets times resolution time times agent hourly cost gives your current support cost; the automation percentage determines how much of that AI absorbs. Annualized savings minus the Smart Exy Bot cost yields the net ROI.',
      },
      {
        question: 'What automation percentage is realistic?',
        answer:
          'Most teams see AI resolve 30-70% of routine tickets, depending on how repetitive their questions are. Start conservative around 30-40% and treat higher rates as an upside scenario.',
      },
      {
        question: 'Is anything I enter stored or sent anywhere?',
        answer:
          'No. The calculator runs entirely in your browser; no figures are transmitted, logged, or saved.',
      },
      {
        question: 'What is Smart Exy Bot?',
        answer:
          'Smart Exy Bot is Exyconn’s AI-powered chat solution for customer service. The calculator uses its pricing at your ticket volume to compute the net ROI figure.',
      },
      {
        question: 'Does the estimate include setup or migration costs?',
        answer:
          'It models the recurring picture — ongoing savings against the bot’s ongoing cost. One-time setup effort is not included, so treat the result as a run-rate estimate.',
      },
    ],
    keywords: [
      'chatbot roi calculator',
      'ai chatbot savings calculator',
      'customer service automation roi',
      'support ticket cost calculator',
      'chatbot cost savings',
      'ai support automation calculator',
      'helpdesk automation roi',
    ],
    metaDescription:
      'Free chatbot ROI calculator: estimate annual savings, hours saved, and net ROI from automating support tickets with AI. Real-time results, no signup.',
  },
  'google-review-link': {
    longDescription: [
      'Every Google Business Profile has a direct link that opens the review form immediately — no searching Google, no scrolling past competitors, no hunting for the review button. This tool builds that link for you. Search for your business by name and city, pick the right listing from the results (each shows its address, rating, and review count), and the link is generated instantly.',
      'If you already know your Place ID, paste it into the Manual ID tab instead — no API key needed for that route. Either way you get a clean write-review URL that you can copy to your clipboard, open in a new tab to confirm the review form loads, or share straight to email or WhatsApp with the built-in share buttons and a pre-written request message.',
      'Business search runs through the Google Places API using your own API key, which you add once in the Secrets drawer and which stays in your browser’s local storage. Because customers land directly on the star-rating dialog, far more of them finish the review — which is why this link belongs in receipt emails, SMS follow-ups, and thank-you pages.',
    ],
    features: [
      'Find your business by name and city through Google Places search',
      'Ratings and review counts shown next to each result so you pick the right listing',
      'Manual ID tab for pasting a known Place ID — no API key required',
      'One-click copy plus a Test Link button that opens the live review form',
      'Email and WhatsApp share shortcuts with a pre-written message',
      'Your Google Places API key stays in your browser’s local storage',
    ],
    useCases: [
      'Add a leave-us-a-review button to receipt and order-confirmation emails',
      'Send SMS review requests after service appointments',
      'Link the review form from your website footer or thank-you page',
      'Give each franchise location its own direct review link',
      'Include the link in a post-purchase WhatsApp follow-up',
    ],
    howTo: [
      'Add your Google Places API key in the Secrets drawer (key icon) — only needed for search',
      'Search your business name and city, or switch to Manual ID and paste your Place ID',
      'Select your business from the results to generate the link',
      'Click Copy Link, or Test Link to confirm the review form opens',
      'Share it by email or WhatsApp with the built-in shortcuts',
    ],
    faqs: [
      {
        question: 'What is a Place ID?',
        answer:
          'A unique identifier Google assigns to every place on Google Maps. The review link is simply Google’s write-review URL with your Place ID appended, which is why the tool needs it.',
      },
      {
        question: 'Do I need a Google API key?',
        answer:
          'Only for the business search tab. If you already know your Place ID — from Google’s Place ID Finder, for example — the Manual ID tab generates the link with no key at all.',
      },
      {
        question: 'Does the review link ever expire?',
        answer:
          'It keeps working as long as your Google Business Profile exists. Google occasionally refreshes Place IDs, so if a link stops working, regenerate it with a fresh search.',
      },
      {
        question: 'Does the link work on phones?',
        answer:
          'Yes. It opens the Google review dialog in the mobile browser or the Google Maps app. Customers do need to be signed in to a Google account to leave a review.',
      },
      {
        question: 'Is sharing a direct review link allowed by Google?',
        answer:
          'Yes — Google encourages asking customers for reviews via a direct link. What its policy forbids is offering incentives for reviews or filtering out unhappy customers first.',
      },
    ],
    keywords: [
      'google review link generator',
      'direct google review link',
      'google place id review link',
      'get more google reviews',
      'share google review link',
      'google business review url',
      'writereview placeid link',
    ],
    metaDescription:
      'Generate a free direct Google review link for your business. Search your listing or paste a Place ID, then copy and share the link by email or WhatsApp.',
  },
  'review-qr-code': {
    longDescription: [
      'The Review QR Code Generator turns your Google review link into a code customers can scan on the spot. Enter your business’s Google Place ID and the tool builds the direct write-review URL, then renders it as a genuine, scannable QR code right in your browser — ready for counters, tables, receipts, packaging, and anywhere else customers stand with phone in hand.',
      'QR generation runs fully client-side using a real QR encoding library — no placeholder patterns and no external chart service — so the code scans with any phone camera and your Place ID never leaves the browser. Download the finished code as a high-resolution PNG suitable for print, or copy the underlying review link to reuse in emails and messages.',
      'Physical touchpoints are where review requests convert best: the customer is present, satisfied, and holding a phone. Restaurants put the code on table tents, salons and clinics at the front desk, tradespeople on invoices and van decals. One scan takes the customer straight to the star-rating dialog with nothing to type.',
    ],
    features: [
      'Generates a real, scannable QR code entirely in your browser',
      'Builds the direct Google write-review URL from your Place ID',
      'High-resolution PNG download sized for print',
      'Copy the underlying review link for digital channels too',
      'No signup, no watermark, and no server upload',
    ],
    useCases: [
      'Table tents and counter cards in a restaurant or cafe',
      'Stickers on takeaway packaging and delivery bags',
      'A QR block on printed invoices from trades and home services',
      'A front-desk sign at a clinic, salon, or gym',
      'The back of a business card handed over after a job well done',
    ],
    howTo: [
      'Find your Google Place ID — via Google’s Place ID Finder or the Google Review Link tool’s business search',
      'Paste the Place ID into the field',
      'Click Generate QR Code',
      'Scan the code with your own phone to confirm it opens your review form',
      'Download the PNG and place it on your print materials',
    ],
    faqs: [
      {
        question: 'Will the QR code actually scan?',
        answer:
          'Yes. The code is produced by a real QR encoding library running in your browser, so any standard phone camera or QR scanner app reads it and opens your Google review form.',
      },
      {
        question: 'How large should I print it?',
        answer:
          'The download is a high-resolution PNG, so it scales cleanly. Keep the printed code at least 2 x 2 cm, leave a white margin around it, and maintain strong contrast with the background.',
      },
      {
        question: 'Does the QR code expire?',
        answer:
          'No. It encodes a stable Google write-review URL, so it keeps working as long as your Google Business Profile and its Place ID remain valid.',
      },
      {
        question: 'Is anything uploaded when I generate the code?',
        answer:
          'No. The QR code is generated entirely client-side in your browser — your Place ID and the resulting link are never sent to a server.',
      },
      {
        question: 'Where do I find my Place ID?',
        answer:
          'Use Google’s Place ID Finder, or open the Google Review Link tool on this site and search for your business by name and city — selecting your listing reveals its Place ID.',
      },
    ],
    keywords: [
      'google review qr code',
      'qr code for google reviews',
      'review qr code generator free',
      'google review qr code for print',
      'place id qr code',
      'get google reviews qr code',
      'restaurant review qr code',
    ],
    metaDescription:
      'Free Google review QR code generator: turn your Place ID into a scannable QR code, generated in your browser, and download a print-ready PNG.',
  },
};
