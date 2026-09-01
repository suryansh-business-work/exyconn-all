import type { ToolDetailsMap } from './types';

/** Detail content for the "ai-chat" tool category. Keyed by tool id from toolsData. */
export const aiChatToolDetails: ToolDetailsMap = {
  'chat-with-website': {
    longDescription: [
      'Chat With Website turns any public web page into something you can question directly. Paste a URL, click Fetch Website, and the Exyconn server pulls the page and strips it down to readable text. From there a chat panel opens: ask what the page says about pricing, request a summary of its sections, or check whether a specific policy is mentioned, and the AI answers from the fetched content rather than from general knowledge.',
      "The tool runs on your own OpenAI API key, which is saved only in your browser's local storage and sent straight from your browser to OpenAI — it never touches Exyconn's servers. Each question includes up to the first 12,000 characters of the fetched page as context, so answers stay grounded in the actual text, and a token-usage readout after every reply shows exactly what each exchange cost.",
      'It suits researchers digesting long articles, SEO and content teams auditing competitor pages, and support or sales staff who need one answer from a documentation page without reading all of it. Because fetching and chatting are separate steps, you can load a page once and ask as many follow-up questions as you like before switching to another URL.',
    ],
    features: [
      'Fetches and cleans page text server-side, then confirms how many characters loaded',
      'Answers grounded in the fetched page content, not generic AI knowledge',
      'Uses your own OpenAI API key with GPT-4o mini — no signup or Exyconn account',
      "API key stored only in your browser's localStorage; remove it anytime",
      'Sends up to 12,000 characters of page context with every question',
      'Token usage shown after each answer so API costs stay visible',
      'Fetch a new URL at any point to start a fresh conversation',
    ],
    useCases: [
      'Summarize a long article or blog post before deciding to read it fully',
      "Probe a competitor's pricing or feature page with targeted questions",
      "Ask whether a vendor's terms-of-service page covers refunds or data retention",
      'Pull key facts from a documentation page during a support call',
      'Quiz a landing page for messaging gaps before a redesign',
    ],
    howTo: [
      'Enter your OpenAI API key in the panel on the left',
      'Paste the full URL of the page (including https://) and click Fetch Website',
      'Wait for the green confirmation showing how many characters were loaded',
      'Type a question in the chat box and send it',
      'Ask follow-ups — the same page content backs every answer until you fetch a new URL',
    ],
    faqs: [
      {
        question: 'Do I need an account to use this?',
        answer: 'No. You only need an OpenAI API key. There is no signup, login, or Exyconn account involved.',
      },
      {
        question: 'Where is my OpenAI API key stored?',
        answer: "In your browser's localStorage only. Chat requests go directly from your browser to OpenAI; the key is never sent to or stored on Exyconn servers.",
      },
      {
        question: 'Why does the tool fetch the page through a server?',
        answer: 'Browsers block cross-origin page reads, so the Exyconn server fetches the URL and returns the readable text to your browser. The page content is used for extraction and not kept.',
      },
      {
        question: 'Can it read pages behind a login?',
        answer: 'No. Only publicly accessible URLs can be fetched. Pages that require authentication or render entirely through JavaScript may return incomplete text.',
      },
      {
        question: 'How much of the page does the AI actually see?',
        answer: 'Up to the first 12,000 characters of extracted text are sent with each question, which covers most articles and landing pages end to end.',
      },
      {
        question: 'What does it cost?',
        answer: "The tool is free. The only cost is OpenAI's usage on your own key (GPT-4o mini), and the token readout shows what each answer consumed.",
      },
    ],
    keywords: [
      'chat with website ai',
      'ask questions about a website',
      'website content chat',
      'ai website summarizer',
      'chat with url',
      'website qa tool',
      'summarize web page with ai',
      'talk to a website',
    ],
    metaDescription:
      'Chat with any website for free. Paste a URL, fetch the page, and ask AI questions answered from the actual page content using your own OpenAI key.',
  },
  'chat-with-text': {
    longDescription: [
      'Chat With Text lets you interrogate any block of text you can copy: an email thread, meeting notes, a contract clause, an exported log, a chapter draft. Paste at least 20 characters, click Set Content, and the chat panel unlocks. Every answer is generated from the pasted text itself, so you can ask for summaries, contradictions, action items, or plain-language explanations of dense passages.',
      'There is no upload and no server-side processing of your text — the content stays in the page and travels only in the request your browser makes to OpenAI with your own API key. Up to 12,000 characters of the pasted text ride along with each question as context. The key itself lives in browser localStorage, and a token counter after each reply keeps API costs transparent.',
      "It's the fastest of the chat tools because there is nothing to fetch or extract: paste, set, ask. That makes it a fit for quick checks — 'what did we actually agree to in this thread?' — as well as longer study sessions where students, analysts, and writers keep one reference text loaded and drill into it question after question.",
    ],
    features: [
      'Works on any pasted text of 20+ characters — no file or URL required',
      'Answers come from your text, with the AI told to reference specific parts',
      'Your text never touches Exyconn servers; it goes only to OpenAI with your own key',
      'Uses GPT-4o mini through your own OpenAI API key stored in browser localStorage',
      'Edit the text and click Set Content again to restart with fresh context',
      'Per-reply token usage display for cost visibility',
    ],
    useCases: [
      'Summarize a long email thread into decisions and open items',
      'Ask plain-language questions about a contract or policy excerpt',
      'Study lecture notes by quizzing yourself against them',
      'Extract names, dates, or figures scattered through pasted meeting minutes',
      'Sanity-check a draft by asking what a reader would find unclear',
    ],
    howTo: [
      'Add your OpenAI API key in the left panel',
      'Paste your text (at least 20 characters) into the text box',
      'Click Set Content and wait for the confirmation with the character count',
      'Ask a question in the chat input on the right',
      'To switch topics, paste new text and click Set Content again',
    ],
    faqs: [
      {
        question: 'Is my pasted text uploaded anywhere?',
        answer: 'It is never sent to Exyconn. The text stays in your browser and is included only in the request your browser sends to OpenAI when you ask a question.',
      },
      {
        question: 'How long can the pasted text be?',
        answer: 'Any length, but only the first 12,000 characters are sent as context with each question — put the important part first for very long texts.',
      },
      {
        question: 'Do I need to re-paste the text for each question?',
        answer: 'No. Once set, the same text backs every question until you change it and press Set Content again.',
      },
      {
        question: 'Which model answers the questions?',
        answer: 'GPT-4o mini, called with your own OpenAI API key, so responses are fast and inexpensive.',
      },
      {
        question: 'Is the tool free?',
        answer: "Yes. Exyconn charges nothing; you only pay OpenAI's per-token price on your own key, shown after each reply.",
      },
    ],
    keywords: [
      'chat with text ai',
      'ask questions about pasted text',
      'ai text qa tool',
      'summarize pasted text',
      'chat with my notes',
      'ai answers from my text',
      'text analysis chat',
      'question answering from text',
    ],
    metaDescription:
      'Free AI chat over any pasted text. Set your content once, then ask questions and get answers grounded in exactly what you pasted — no signup needed.',
  },
  'chat-with-documents': {
    longDescription: [
      'Chat With Documents takes a file — TXT, DOC, DOCX, or PDF — and turns it into a conversation. Choose a file and the Exyconn server extracts its text; a green confirmation shows the file name and how many characters were pulled out. From then on you ask questions in the chat panel and the AI answers from the document itself: summaries, key points, specific clauses, or comparisons between sections.',
      'Extraction is the only server-side step: your file is sent to the Exyconn server, converted to plain text, returned to your browser, and not stored. The chat itself runs on your own OpenAI API key, kept in browser localStorage and used directly from your browser, with up to 12,000 characters of the extracted text attached to each question. Token usage appears after every reply.',
      'One tool covers the mixed folders real work produces — a Word contract, a PDF report, a plain-text export — without switching pages. It suits anyone who receives documents faster than they can read them: lawyers scanning agreements, managers digesting reports, researchers triaging papers, and students working through course readings.',
    ],
    features: [
      'Accepts TXT, DOC, DOCX, and PDF in a single tool',
      'Server-side text extraction with a character-count confirmation per file',
      'Files are processed for extraction only — not stored on the server',
      'Chat runs on your own OpenAI API key (GPT-4o mini), saved only in your browser',
      'Answers grounded in up to 12,000 characters of the extracted text',
      'Upload a new file at any time to reset the conversation',
      'Token usage shown after each answer',
    ],
    useCases: [
      'Summarize a lengthy PDF report into a one-paragraph brief',
      'Ask a DOCX contract what it says about termination or liability',
      'Find every mention of a person, product, or date in a long document',
      'Turn meeting minutes into a list of decisions and owners',
      'Check what two sections of the same document each claim',
    ],
    howTo: [
      'Enter your OpenAI API key in the left panel',
      'Click Choose File and pick a TXT, DOC, DOCX, or PDF',
      'Wait for extraction to finish — the confirmation shows the file name and character count',
      'Ask your first question in the chat box',
      'Keep asking follow-ups, or upload a different file to start over',
    ],
    faqs: [
      {
        question: 'What happens to my uploaded file?',
        answer: 'It is sent to the Exyconn server once, converted to plain text, and the text is returned to your browser. The file is not stored after extraction.',
      },
      {
        question: 'Which file types are supported?',
        answer: 'TXT, DOC, DOCX, and PDF. Image-only (scanned) PDFs have no embedded text to extract — run them through the OCR PDF tool first.',
      },
      {
        question: 'Does the AI read the whole document?',
        answer: 'Up to the first 12,000 characters of extracted text accompany each question. For very long documents, ask about early sections or split the file.',
      },
      {
        question: 'Is my OpenAI API key safe?',
        answer: "It is stored only in your browser's localStorage and sent directly from your browser to OpenAI — never to Exyconn.",
      },
      {
        question: 'Is there a file size limit?',
        answer: 'Files are uploaded as base64 for extraction, so very large files can fail. Documents up to a few megabytes work best.',
      },
      {
        question: 'Is it free?',
        answer: "Yes — the tool is free. You pay only OpenAI's token cost on your own key, shown after each reply.",
      },
    ],
    keywords: [
      'chat with documents ai',
      'ask questions about a document',
      'ai document qa',
      'chat with docx and pdf',
      'summarize document ai free',
      'upload document ask questions',
      'document chat tool',
      'ai read my document',
    ],
    metaDescription:
      'Upload a TXT, DOC, DOCX, or PDF and chat with it for free. AI answers questions from the extracted text using your own OpenAI API key.',
  },
  'chat-with-pdf': {
    longDescription: [
      "Chat With PDF answers questions from the actual text of a PDF instead of making you scroll for it. Upload a file, the Exyconn server extracts its text layer, and a chat panel opens against that content. The assistant is instructed to be accurate and cite specific sections where possible, so asking 'what does section 4 say about payment terms?' returns the relevant wording, not a guess.",
      'The workflow keeps your data exposure small: the PDF goes to the Exyconn server once for extraction, comes back as plain text, and is not stored. Questions are answered by GPT-4o mini using your own OpenAI API key — held in browser localStorage and sent straight from browser to OpenAI — with up to 12,000 characters of PDF text as context and a per-reply token readout.',
      'PDFs are where long, dense material ends up: research papers, contracts, manuals, financial reports. This tool is for the people who live in them — a lawyer confirming a clause, an engineer finding one setting in a 90-page manual, a student pulling the method section out of a paper — without reading front to back.',
    ],
    features: [
      'Upload any text-based PDF and chat with its contents',
      'Answers cite specific sections of the document where possible',
      'Server-side extraction only — the PDF is not stored after processing',
      'Runs on your own OpenAI API key (GPT-4o mini), kept in browser localStorage',
      'Up to 12,000 characters of PDF text sent as context per question',
      'Character-count confirmation so you know extraction worked',
      'Token usage displayed after each answer',
    ],
    useCases: [
      'Pull the key findings out of a research paper in two questions',
      'Ask a contract PDF about notice periods, penalties, or renewal terms',
      'Locate a single configuration step inside a long product manual',
      "Summarize a quarterly report before the meeting it's discussed in",
      'Check what an invoice or statement actually itemizes',
    ],
    howTo: [
      'Add your OpenAI API key in the panel on the left',
      'Click Choose File and select a PDF',
      'Wait for the extraction confirmation showing the character count',
      "Type a question in the chat input — e.g. 'summarize the main findings'",
      'Ask follow-ups against the same PDF, or upload another to switch',
    ],
    faqs: [
      {
        question: 'Is my PDF stored on your servers?',
        answer: 'No. It is uploaded once for text extraction, the text is returned to your browser, and the file is not kept.',
      },
      {
        question: 'My PDF is scanned — why are answers empty or wrong?',
        answer: 'Scanned PDFs contain page images, not text, so there is nothing to extract. Run the file through the OCR PDF tool first, then chat with the result.',
      },
      {
        question: 'How big a PDF can I upload?',
        answer: 'Uploads are base64-encoded, so keep files to a few megabytes. Only the first 12,000 characters of text are used per question either way.',
      },
      {
        question: 'Does it work with password-protected PDFs?',
        answer: 'No. Remove the password first — the Unlock PDF tool does this when you know the password — and then upload.',
      },
      {
        question: 'Whose AI answers the questions?',
        answer: "OpenAI's GPT-4o mini, using your own API key. The key stays in your browser's localStorage and is never sent to Exyconn.",
      },
      {
        question: 'What does it cost?',
        answer: "The tool is free. You pay only OpenAI's token price on your own key, and the usage readout after every reply shows exactly how much.",
      },
    ],
    keywords: [
      'chat with pdf free',
      'ask pdf questions ai',
      'pdf chat tool',
      'ai pdf reader',
      'summarize pdf with ai',
      'talk to pdf',
      'pdf question answering',
      'chat with pdf online no signup',
    ],
    metaDescription:
      "Chat with any PDF for free. Upload a file, let the text be extracted, then ask questions and get answers cited from the document's content.",
  },
  'chat-with-word': {
    longDescription: [
      "Chat With Word Files does for DOC and DOCX what a good colleague does for a long report: reads it and answers your questions. Upload a Word document, the Exyconn server extracts its text, and the chat panel unlocks. Ask for a summary, the exact wording of a clause, every deadline mentioned, or an explanation of a technical passage — answers come from the file's actual content.",
      'Your document makes one round trip to the Exyconn server for text extraction and is not stored afterwards; everything else happens between your browser and OpenAI. The chat uses GPT-4o mini through your own API key, saved only in browser localStorage, with up to 12,000 characters of the document attached to each question and token usage reported after each reply.',
      'Word files dominate contracts, proposals, HR policies, and drafts-in-progress, and this tool targets exactly those: an HR manager checking what the leave policy actually says, a freelancer verifying a statement of work, an editor asking where a draft repeats itself. If your file is a PDF or plain text instead, the Chat With Documents tool handles those formats too.',
    ],
    features: [
      'Purpose-built for DOC and DOCX uploads',
      'Server-side extraction with a visible character count on success',
      'Documents are processed for extraction only, never stored',
      'Uses your own OpenAI API key (GPT-4o mini) straight from the browser',
      'Up to 12,000 characters of document text as context per question',
      'Swap in a new file anytime to start a fresh chat',
      'Per-answer token usage display',
    ],
    useCases: [
      'Ask an employment contract about probation, notice, or non-compete terms',
      'Reduce a 30-page proposal to its commitments and prices',
      'Check an HR policy document for what applies to remote employees',
      'Find every date and deliverable buried in a statement of work',
      'Interrogate an old report you wrote before reusing its claims',
    ],
    howTo: [
      'Enter your OpenAI API key on the left',
      'Click Choose File and select a .doc or .docx file',
      'Wait for the green confirmation with the file name and character count',
      'Ask a question in the chat panel on the right',
      'Upload a different Word file whenever you want to change context',
    ],
    faqs: [
      {
        question: 'Are my Word files kept after upload?',
        answer: 'No. The file is converted to text on the Exyconn server and discarded; only the extracted text returns to your browser.',
      },
      {
        question: 'Does formatting like tables and comments survive?',
        answer: 'Extraction keeps the readable text. Complex tables flatten into plain text, and tracked changes or comments may not come through — ask about content rather than layout.',
      },
      {
        question: 'Are both .doc and .docx supported?',
        answer: 'Yes, both the legacy .doc format and the modern .docx format are accepted.',
      },
      {
        question: 'Where does my API key go?',
        answer: "Only into your browser's localStorage and the requests your browser sends to OpenAI. Exyconn never receives it.",
      },
      {
        question: 'Can I chat with several documents at once?',
        answer: 'One document at a time — uploading a new file replaces the previous context and clears the chat.',
      },
      {
        question: 'Is the tool really free?',
        answer: 'Yes. The only cost is OpenAI usage billed to your own key, with token counts shown after each reply.',
      },
    ],
    keywords: [
      'chat with word document ai',
      'ask questions about docx',
      'ai word document reader',
      'summarize word document',
      'chat with docx free',
      'doc file ai chat',
      'word document question answering',
      'ai read docx file',
    ],
    metaDescription:
      "Chat with Word documents for free. Upload a DOC or DOCX, extract its text, and ask AI questions answered from the file's actual content.",
  },
  'ai-chat-analyzer': {
    longDescription: [
      "AI Chat Analyzer reviews chatbot transcripts the way a conversation designer would: it reads the log and tells you what went right and what went wrong. Paste a chat log of at least 50 characters — support bot sessions, sales assistant chats, internal helpdesk transcripts — optionally choose a focus area, and then ask questions like 'where did the bot lose the user?' or 'which intents failed?'",
      'Four optional focus areas steer the analysis — User Satisfaction, Bot Accuracy, Conversation Flow, and Improvement Opportunities — or leave it on General Analysis for a broad read. The system prompt casts the model as an expert chatbot conversation analyst, so answers arrive as actionable findings rather than a re-narration of the transcript. Up to 10,000 characters of the log are analyzed per question.',
      "Analysis runs on your own OpenAI API key (GPT-4o mini): the key stays in your browser's localStorage, and the pasted log travels only in the request your browser sends to OpenAI — nothing is uploaded to Exyconn. That makes it a practical review loop for chatbot builders, CX leads, and support managers who tune bots weekly: paste a session, probe it, fix the flow, repeat.",
    ],
    features: [
      'Purpose-built prompt: an expert chatbot conversation analyst, not a generic chat',
      'Four selectable focus areas: user satisfaction, bot accuracy, conversation flow, improvement opportunities',
      'Interactive analysis — ask follow-up questions instead of getting one static report',
      'Logs are analyzed via your own OpenAI key; nothing is sent to Exyconn servers',
      'Handles up to 10,000 characters of transcript per question',
      'Token usage shown after each answer for cost control',
    ],
    useCases: [
      'Audit a week of support-bot conversations for repeated failure points',
      "Score a new bot flow's accuracy before rolling it out widely",
      'Find the exact turns where users get frustrated and abandon the chat',
      'Turn a messy escalation transcript into concrete flow fixes',
      'Paste two sessions of the same intent into one log and compare how the bot handled each',
    ],
    howTo: [
      'Add your OpenAI API key in the left panel',
      'Paste a chatbot transcript (at least 50 characters) into the chat-log box',
      'Optionally pick a focus area such as Bot Accuracy or Conversation Flow',
      'Click Set Chat Log and wait for the confirmation',
      "Ask analysis questions — e.g. 'What are the main issues?' or 'Rate the bot's answers'",
      'Change the focus area between questions to view the same log from another angle',
    ],
    faqs: [
      {
        question: 'What format does the chat log need to be in?',
        answer: "Plain text with speakers marked, e.g. 'User: ...' and 'Bot: ...' lines. Any readable transcript works, but clear turn labels give sharper analysis.",
      },
      {
        question: 'Is my transcript private?',
        answer: 'It is never uploaded to Exyconn. The log stays in your browser and is sent only to OpenAI, under your own API key, when you ask a question.',
      },
      {
        question: 'How long a log can I analyze?',
        answer: 'Up to 10,000 characters go to the model with each question. For longer histories, analyze sessions in batches.',
      },
      {
        question: 'What do the focus areas actually change?',
        answer: 'The selected focus is added to the prompt so answers concentrate on that dimension — satisfaction, accuracy, flow, or improvements — instead of a general review.',
      },
      {
        question: 'Can it analyze human-to-human chats too?',
        answer: 'Yes. The prompt is tuned for bot conversations, but support or sales transcripts between people still get useful summaries and sentiment reads.',
      },
      {
        question: 'What does it cost?',
        answer: "The tool is free; analysis runs on OpenAI's GPT-4o mini billed to your own key, with token counts shown per reply.",
      },
    ],
    keywords: [
      'chatbot conversation analysis',
      'analyze chat logs with ai',
      'chatbot transcript analyzer',
      'bot conversation insights',
      'chatbot performance review',
      'ai chat log analysis tool',
      'improve chatbot responses',
      'support bot audit',
    ],
    metaDescription:
      'Analyze chatbot conversations free with AI. Paste a chat log, pick a focus like bot accuracy, and get actionable insights on performance.',
  },
};
