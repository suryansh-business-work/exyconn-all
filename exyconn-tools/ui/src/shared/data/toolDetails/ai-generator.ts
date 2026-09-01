import type { ToolDetailsMap } from './types';

/** Detail content for the "ai-generator" tool category. Keyed by tool id from toolsData. */
export const aiGeneratorToolDetails: ToolDetailsMap = {
  'ai-prompt-generator': {
    longDescription: [
      'The AI Prompt Generator turns a plain-language goal into a complete, well-structured prompt you can paste into ChatGPT, Claude, Gemini, or any other AI model. Describe what you want — "write a marketing email for a SaaS launch", "summarize legal contracts" — and it produces a detailed prompt with role framing, context, constraints, and a defined output format.',
      'The tool runs in your browser using your own OpenAI API key. The key is saved in local storage on your device and requests go straight from your browser to the OpenAI API — nothing passes through or is stored on Exyconn servers. Generation uses the fast, low-cost gpt-4o-mini model, and the token count for each request is shown alongside the result.',
      'It is built for anyone who uses AI models regularly but does not want to study prompt engineering: marketers drafting campaign prompts, developers preparing system prompts for their apps, support teams building reply templates, and students structuring research questions. Add optional context such as target audience or tone to make the generated prompt even more specific.',
    ],
    features: [
      'Turns a one-line topic or goal into a fully structured AI prompt',
      'Adds role framing, context, constraints, and an expected output format automatically',
      'Optional context field for audience, tone, and special requirements',
      'Works with any AI model — ChatGPT, Claude, Gemini, Llama, and more',
      'Uses your own OpenAI API key with the low-cost gpt-4o-mini model',
      'One-click copy of the generated prompt, with token usage shown per request',
    ],
    useCases: [
      'Create a reusable system prompt for a customer-support chatbot',
      'Draft a detailed content-writing prompt for weekly blog production',
      'Build a code-review prompt that enforces your team standards',
      'Turn a vague idea like "help me study biology" into a structured tutoring prompt',
    ],
    howTo: [
      'Paste your OpenAI API key into the API key field (it is stored only in your browser).',
      'Enter your topic or goal, e.g. "Write a marketing email for a SaaS product launch".',
      'Optionally add context such as target audience, tone, or specific requirements.',
      'Click Generate Prompt and wait a few seconds for the result.',
      'Copy the generated prompt with the copy button and paste it into your AI tool of choice.',
    ],
    faqs: [
      {
        question: 'Do I need my own OpenAI API key?',
        answer:
          'Yes. The tool calls the OpenAI API directly from your browser with your key, so you pay only the per-token price — gpt-4o-mini costs a fraction of a cent per prompt. Exyconn adds no charge.',
      },
      {
        question: 'Is my API key safe?',
        answer:
          "The key is stored in your browser's local storage and is sent only to api.openai.com. It never touches Exyconn servers, and you can remove it at any time.",
      },
      {
        question: 'Can I use the generated prompts with Claude or Gemini?',
        answer:
          'Yes. The prompts are model-agnostic — role framing, context, and output-format instructions work the same across ChatGPT, Claude, Gemini, and open-source models.',
      },
      {
        question: 'What makes a generated prompt better than my own one-liner?',
        answer:
          'The generator expands your goal with a role, explicit constraints, and a defined output format — the elements that most influence answer quality and consistency.',
      },
      {
        question: 'Which model generates the prompts?',
        answer:
          "Requests use OpenAI's gpt-4o-mini, which is fast and inexpensive. Token usage for each generation is displayed under the result.",
      },
    ],
    keywords: [
      'ai prompt generator',
      'chatgpt prompt generator',
      'prompt generator free',
      'generate ai prompts online',
      'prompt engineering tool',
      'claude prompt generator',
      'system prompt generator',
      'ai prompt maker',
    ],
    metaDescription:
      'Free AI prompt generator: turn a plain goal into a structured ChatGPT or Claude prompt with role, context, and output format. Uses your own OpenAI key.',
  },
  'ai-prompt-optimizer': {
    longDescription: [
      'The AI Prompt Optimizer takes a prompt you already use and rewrites it to get better answers from AI models. Paste your current prompt, optionally state what you want improved — more concise, clearer instructions, a stricter output format — and it returns a refined version with sharper wording, explicit constraints, and structure that models follow more reliably.',
      "Optimization runs with your own OpenAI API key, entered once and kept in your browser's local storage. Your prompt is sent from the browser directly to the OpenAI API using the gpt-4o-mini model; Exyconn servers never see your key or your prompts. Each optimization shows its token usage, so you always know what a request cost.",
      'Use it when a prompt gives inconsistent answers, drifts off topic, or produces the wrong format. It is a practical fit for developers tuning system prompts in production apps, content teams maintaining shared prompt libraries, and anyone iterating on a ChatGPT or Claude prompt who wants an expert second pass instead of guessing at rewrites.',
    ],
    features: [
      'Rewrites an existing prompt for clarity, specificity, and reliable structure',
      'Optional goal field steers the rewrite — shorten it, add context, tighten the output format',
      'Works on prompts for any model: ChatGPT, Claude, Gemini, or local LLMs',
      'Direct browser-to-OpenAI calls with your own API key — nothing stored on Exyconn servers',
      'Token usage displayed for every optimization',
      'Copy the optimized prompt to your clipboard in one click',
    ],
    useCases: [
      'Fix a system prompt that makes your chatbot ramble or break character',
      'Tighten a content-generation prompt so every draft comes back in the same format',
      'Compress a long prompt to cut token costs without losing instructions',
      'Standardize prompts across a shared team prompt library',
    ],
    howTo: [
      "Add your OpenAI API key — it stays in your browser's local storage.",
      'Paste your existing prompt into the "Your Current Prompt" field.',
      'Optionally describe an optimization goal, such as "make it more concise" or "improve clarity".',
      'Click Optimize Prompt and review the rewritten version.',
      'Copy the result and replace your old prompt wherever you use it.',
    ],
    faqs: [
      {
        question: 'What does the optimizer actually change?',
        answer:
          'It sharpens vague wording, adds explicit constraints and output-format instructions, and reorders the prompt into a structure AI models follow more consistently. Your intent is preserved.',
      },
      {
        question: 'Can I control the direction of the optimization?',
        answer:
          'Yes. The optional goal field lets you ask for a specific improvement, such as making the prompt shorter, adding more context, or enforcing a JSON output.',
      },
      {
        question: 'Is my prompt private?',
        answer:
          'Yes. The prompt goes straight from your browser to the OpenAI API with your own key. Exyconn servers never receive or store your prompts.',
      },
      {
        question: 'Do I need an OpenAI account?',
        answer:
          'Yes — the tool needs your OpenAI API key. Optimization uses gpt-4o-mini, so a typical run costs a fraction of a cent, billed to your OpenAI account.',
      },
      {
        question: 'Will the optimized prompt work outside ChatGPT?',
        answer:
          'Yes. The improvements — clear roles, constraints, and format specifications — transfer directly to Claude, Gemini, and open-source models.',
      },
    ],
    keywords: [
      'ai prompt optimizer',
      'improve chatgpt prompt',
      'prompt rewriter',
      'optimize ai prompt online',
      'prompt engineering optimizer',
      'refine ai prompt free',
      'better chatgpt prompts',
      'system prompt optimizer',
    ],
    metaDescription:
      'Optimize AI prompts free: paste your ChatGPT or Claude prompt and get a clearer, better-structured rewrite. Runs in your browser with your OpenAI key.',
  },
  'ai-answer-generator': {
    longDescription: [
      'The AI Answer Generator gives you a direct, well-organized answer to any question without opening a chat app or juggling conversation history. Type a question, optionally add context that narrows the scope — your industry, the audience, what you already know — and it returns a focused answer you can copy straight into a document, email, or ticket.',
      "Answers are produced by OpenAI's gpt-4o-mini model, called directly from your browser with your own API key. The key lives in local storage on your device and is never transmitted to Exyconn servers, so your questions and answers stay between you and OpenAI. Each response shows its token count, keeping costs transparent.",
      'It suits quick factual lookups, explanations of technical concepts, and drafting answers for FAQs, forums, or knowledge bases. Because there is no chat thread, every question starts clean — useful when you want repeatable, self-contained answers rather than a conversation that drifts away from the original question over time.',
    ],
    features: [
      'One-shot answers to any question — no chat history to manage',
      'Optional context field to scope the answer to your situation',
      'Powered by OpenAI gpt-4o-mini via your own API key',
      'Runs from your browser; questions never pass through Exyconn servers',
      'Copy any answer to the clipboard in one click',
      'Per-request token usage shown with every answer',
    ],
    useCases: [
      'Draft answers for a product FAQ or help-center article',
      'Get a plain-English explanation of a technical term for documentation',
      'Answer a niche customer question before replying to their ticket',
      'Sanity-check your understanding of a concept while studying',
    ],
    howTo: [
      'Enter your OpenAI API key; it is saved only in your browser.',
      'Type your question in the "Your Question" field.',
      'Optionally add context so the answer matches your use case.',
      'Click Get Answer and read the generated response.',
      'Use the copy button to paste the answer wherever you need it.',
    ],
    faqs: [
      {
        question: 'How is this different from just using ChatGPT?',
        answer:
          'There is no conversation thread — each question is answered on its own, which keeps answers consistent and repeatable. It is also faster for one-off questions: no login and no chat management.',
      },
      {
        question: 'Are my questions stored anywhere?',
        answer:
          'Not by Exyconn. Requests go directly from your browser to the OpenAI API using your key; results exist only in your browser tab until you copy or discard them.',
      },
      {
        question: 'Can it answer questions about current events?',
        answer:
          'The model answers from its training data and has no live web access, so very recent events may be missing or outdated. Verify time-sensitive facts against a current source.',
      },
      {
        question: 'What does each answer cost?',
        answer:
          "The tool is free; you pay only OpenAI's gpt-4o-mini token price through your own API key — typically well under a cent per answer. The exact token count is shown under each result.",
      },
      {
        question: 'Does the context field really help?',
        answer:
          'Yes. Telling the model who is asking and why — "explain for a non-technical customer" — measurably changes the depth, tone, and vocabulary of the answer.',
      },
    ],
    keywords: [
      'ai answer generator',
      'ask ai a question',
      'instant ai answers',
      'free ai question answering',
      'ai answer bot online',
      'generate answers with ai',
      'question answer generator',
    ],
    metaDescription:
      'Get instant AI answers to any question free. Add context for tailored responses — runs in your browser with your own OpenAI API key, nothing stored.',
  },
  'ai-reply-generator': {
    longDescription: [
      'The AI Reply Generator writes a ready-to-send reply to any message you paste in — a WhatsApp text, a LinkedIn DM, a Slack thread, a review, or a comment. Choose one of seven tones, from Professional and Formal to Casual, Empathetic, or Concise, add any points you want covered, and it drafts a reply that matches the tone and actually addresses the original message.',
      "Everything runs from your browser with your own OpenAI API key, which is stored in local storage on your device and sent only to the OpenAI API. The messages you paste never touch Exyconn servers. Replies are generated with gpt-4o-mini, and each request's token usage is shown so you can see exactly what it cost.",
      'It is made for people who answer a lot of messages: community managers responding to comments and reviews, freelancers replying to client pings, sales reps answering inbound DMs, and anyone who knows what they want to say but keeps rewriting how to say it. The tone selector keeps replies consistent across a whole inbox.',
    ],
    features: [
      'Seven selectable tones: Professional, Friendly, Casual, Formal, Enthusiastic, Empathetic, and Concise',
      'Context field for points the reply must include',
      'Handles any message type — chat, DM, review, comment, or forum post',
      'Runs in your browser with your own OpenAI API key; messages never reach Exyconn servers',
      'One-click copy of the finished reply',
      'Token usage shown for every generation',
    ],
    useCases: [
      'Respond to a negative customer review with an empathetic, professional reply',
      'Answer a recruiter LinkedIn message in a polished but friendly tone',
      'Draft consistent responses to repetitive customer questions in chat',
      'Reply diplomatically to a heated Slack or forum thread',
    ],
    howTo: [
      'Add your OpenAI API key (stored only in your browser).',
      'Paste the message you received into the "Original Message" field.',
      'Pick a tone and optionally list points the reply should include.',
      'Click Generate Reply.',
      'Copy the reply, tweak anything personal, and send it.',
    ],
    faqs: [
      {
        question: 'Which tone should I pick?',
        answer:
          'Match the channel: Professional or Formal for business contacts, Friendly or Casual for social messages, Empathetic for complaints, and Concise when a short acknowledgment is enough.',
      },
      {
        question: 'Can I make sure specific points appear in the reply?',
        answer:
          'Yes — list them in the Additional Context field and the generated reply will work them in naturally.',
      },
      {
        question: 'Is the message I paste kept private?',
        answer:
          'Yes. It goes directly from your browser to the OpenAI API under your key and is never sent to or stored on Exyconn servers.',
      },
      {
        question: 'Does it work in languages other than English?',
        answer:
          'Yes. Paste a message in most major languages and the model will typically reply in the same language; you can also request a language explicitly in the context field.',
      },
      {
        question: 'What does it cost?',
        answer:
          'The tool is free. Generation runs on your own OpenAI key with gpt-4o-mini, so a reply usually costs a fraction of a cent, billed by OpenAI.',
      },
    ],
    keywords: [
      'ai reply generator',
      'smart reply generator',
      'ai message reply',
      'reply to a review with ai',
      'generate replies free',
      'ai response generator',
      'reply writer online',
    ],
    metaDescription:
      'Generate smart replies to any message free: pick from 7 tones, add key points, then copy and send. Browser-based with your own OpenAI API key.',
  },
  'ai-email-reply-generator': {
    longDescription: [
      'The AI Email Reply Generator drafts a complete, professional reply to any email you paste in. Pick the intent of your response — Accept, Decline, Follow-up, Clarify, Thank, Apologize, Negotiate, or Request — choose a tone from Professional to Concise, and it writes a reply that answers the sender and moves the thread forward, ready to paste into Gmail or Outlook.',
      "The tool runs client-side with your own OpenAI API key. The key is kept in your browser's local storage, and the email you paste travels only from your browser to the OpenAI API — Exyconn servers never receive your correspondence. Replies come from the gpt-4o-mini model, with per-request token usage displayed under the result.",
      'It is built for the emails people put off: declining a vendor politely, negotiating a rate, apologizing for a delay, or chasing a response without sounding pushy. Because intent and tone are set explicitly before generation, the awkward part of composing — finding the right framing — is already done before you start editing the draft.',
    ],
    features: [
      'Eight reply intents: Accept, Decline, Follow-up, Clarify, Thank, Apologize, Negotiate, Request',
      'Five tones: Professional, Friendly, Formal, Concise, Detailed',
      'Replies address the actual points in the original email, not a generic template',
      'Your email and API key stay between your browser and OpenAI — nothing stored by Exyconn',
      'One-click copy, ready to paste into Gmail, Outlook, or any client',
      'Token usage shown for each generated reply',
    ],
    useCases: [
      'Decline a meeting or proposal politely without burning the relationship',
      'Follow up on an unanswered quote or invoice with a firm but friendly nudge',
      'Apologize to a customer for a shipping delay in a professional tone',
      'Negotiate a freelance rate increase with measured, confident wording',
    ],
    howTo: [
      'Enter your OpenAI API key (saved only in your browser).',
      'Paste the email you received into the "Original Email" field.',
      'Select the intent of your reply and the tone you want.',
      'Click Generate Email Reply.',
      'Copy the draft, personalize names and details, and send it from your email client.',
    ],
    faqs: [
      {
        question: 'Will the reply reference what the sender actually wrote?',
        answer:
          'Yes. The full email you paste is given to the model, so the reply responds to its specific points rather than producing a generic template.',
      },
      {
        question: 'Is it safe to paste work emails here?',
        answer:
          "The email is sent only from your browser to the OpenAI API using your key; Exyconn servers never see it. For confidential material, follow your company's policy on third-party AI services.",
      },
      {
        question: 'What is the difference between intent and tone?',
        answer:
          'Intent is what the reply does (accept, decline, negotiate); tone is how it sounds (formal, friendly, concise). Combining them gives precise control — e.g. a friendly decline or a formal follow-up.',
      },
      {
        question: 'Can it write the reply in my language?',
        answer:
          'Replies default to the language of the original email, and most major languages work well with gpt-4o-mini.',
      },
      {
        question: 'Do I still need to edit the draft?',
        answer:
          'Usually only lightly — check names, dates, and specifics before sending. The structure, framing, and tone are handled for you.',
      },
    ],
    keywords: [
      'ai email reply generator',
      'email response generator',
      'reply to email with ai',
      'professional email reply free',
      'decline email generator',
      'follow up email ai',
      'email reply writer',
    ],
    metaDescription:
      'Write professional email replies free: paste the email, pick an intent (accept, decline, follow-up) and tone, and get a send-ready draft in seconds.',
  },
  'ai-letter-generator': {
    longDescription: [
      'The AI Letter Generator writes complete formal letters from a short brief. Choose from nine letter types — Cover Letter, Recommendation, Resignation, Complaint, Thank You, Invitation, Apology, Request, or Business Proposal — name the recipient, describe the purpose, and it produces a properly structured letter with a suitable opening, body, and closing.',
      'Generation happens in your browser through your own OpenAI API key, stored in local storage on your device. The details you enter go directly to the OpenAI API and are never sent to Exyconn servers. The gpt-4o-mini model keeps each letter fast and inexpensive, and token usage is displayed with every result so costs stay visible.',
      'It helps anyone facing a letter they rarely write: a job seeker tailoring a cover letter, an employee resigning gracefully, a manager drafting a recommendation, or a customer escalating a complaint. The Additional Details field lets you feed in specifics — dates, qualifications, order numbers — so the letter is concrete instead of boilerplate.',
    ],
    features: [
      'Nine letter types, from cover letters and recommendations to complaints and business proposals',
      'Recipient and purpose fields shape the salutation and framing',
      'Details field for the specifics that make the letter concrete — dates, names, achievements',
      'Correct formal structure: opening, body paragraphs, and closing',
      'Runs in your browser with your own OpenAI API key — your details never reach Exyconn servers',
      'One-click copy for pasting into a document or email',
    ],
    useCases: [
      'Write a cover letter tailored to a specific job posting and hiring manager',
      'Resign professionally with a courteous, well-structured resignation letter',
      'Draft a recommendation letter for a former colleague or student',
      'Escalate a billing complaint with a firm, factual letter',
      'Send a formal thank-you after an interview or event',
    ],
    howTo: [
      'Add your OpenAI API key (kept only in your browser).',
      'Select a letter type and enter the recipient, e.g. "Hiring Manager, Acme Corp".',
      'Describe the purpose of the letter in a sentence or two.',
      'Optionally add details such as key points, your background, or requirements.',
      'Click Generate Letter, then copy and format the result in your editor.',
    ],
    faqs: [
      {
        question: 'Which letter types are supported?',
        answer:
          'Cover Letter, Recommendation, Resignation, Complaint, Thank You, Invitation, Apology, Request, and Business Proposal. Each gets structure and tone appropriate to its type.',
      },
      {
        question: 'How specific should my inputs be?',
        answer:
          "The more specific, the better the letter. Include the recipient's role, concrete dates or events, and two or three key points in the details field to avoid a generic result.",
      },
      {
        question: 'Is my personal information private?',
        answer:
          'Details you enter go straight from your browser to the OpenAI API under your own key. Exyconn never receives or stores your letters.',
      },
      {
        question: 'Can I use the output as-is?',
        answer:
          'Treat it as a strong draft: verify names, dates, and claims, and add your signature block. For high-stakes letters like resignations, a personal read-through is essential.',
      },
      {
        question: 'Does it cost anything?',
        answer:
          'The tool is free. Each letter is generated with your OpenAI API key on gpt-4o-mini, which typically costs less than a cent per letter.',
      },
    ],
    keywords: [
      'ai letter generator',
      'cover letter generator free',
      'resignation letter generator',
      'formal letter writer ai',
      'complaint letter generator',
      'recommendation letter ai',
      'letter writing tool online',
    ],
    metaDescription:
      'Generate formal letters free with AI: cover, resignation, complaint, recommendation and more. Add a recipient and purpose, get a structured draft.',
  },
  'ai-blog-title-generator': {
    longDescription: [
      'The AI Blog Title Generator produces batches of SEO-friendly headline options for any topic. Enter your subject, optionally add the keywords you are targeting, choose how many titles you want — 5, 10, 15, or 20 — and it returns a varied list mixing how-tos, listicles, questions, and curiosity-driven angles so you can pick the strongest one.',
      'Titles are generated in your browser with your own OpenAI API key using the gpt-4o-mini model. The key sits in local storage and every request goes straight to the OpenAI API — your topics and keyword strategy never pass through Exyconn servers. Token usage appears with each batch, and regenerating with tweaked keywords takes seconds.',
      'Bloggers, content marketers, and SEO teams use it to break headline block: instead of staring at one working title, you compare twenty angles at once. Feeding in your target keywords keeps the suggestions aligned with what you want to rank for, and mixing formats helps you learn which style earns clicks with your audience.',
    ],
    features: [
      'Generates 5, 10, 15, or 20 title options per run',
      'Optional comma-separated SEO keywords steer every suggestion',
      'Varied formats: how-tos, listicles, questions, and curiosity hooks',
      'Instant regeneration to explore new angles on the same topic',
      'Browser-based with your own OpenAI API key — topics never reach Exyconn servers',
      'Copy the full list with one click',
    ],
    useCases: [
      "Pick a headline for this week's blog post from 20 fresh options",
      'Generate keyword-aligned title variants for an SEO content calendar',
      'A/B test two title styles for the same article in your newsletter',
      'Brainstorm YouTube or podcast episode titles from the same topic',
    ],
    howTo: [
      'Enter your OpenAI API key (stored only in your browser).',
      'Type your blog topic, e.g. "remote work productivity".',
      'Optionally add comma-separated SEO keywords to target.',
      'Pick how many titles you want — 5, 10, 15, or 20 — and click Generate Titles.',
      'Copy the list and shortlist the strongest options.',
    ],
    faqs: [
      {
        question: 'How do the keywords affect the titles?',
        answer:
          'The model weaves your keywords into the suggestions naturally, so the titles support the search terms you are targeting instead of fighting them.',
      },
      {
        question: 'Are the titles unique?',
        answer:
          'Each run is generated fresh, so you will not get a canned list. Popular topics can still resemble what already ranks — check the search results before publishing.',
      },
      {
        question: 'What title length is best for SEO?',
        answer:
          'Keep titles under roughly 60 characters so they do not truncate in Google results. Add "under 60 characters" to your topic if you want the batch kept short.',
      },
      {
        question: 'Is my content strategy kept private?',
        answer:
          'Yes. Topics and keywords go directly from your browser to the OpenAI API with your key; Exyconn never sees or stores them.',
      },
      {
        question: 'How much does a batch cost?',
        answer:
          "The tool is free — you pay only OpenAI's gpt-4o-mini token price on your own key, typically a fraction of a cent for 20 titles.",
      },
    ],
    keywords: [
      'blog title generator',
      'ai blog title generator free',
      'seo title generator',
      'headline generator',
      'blog post title ideas',
      'catchy title generator',
      'article title generator',
    ],
    metaDescription:
      'Free AI blog title generator: get 5-20 SEO-friendly headline ideas for any topic, steered by your target keywords. Fast, browser-based, no signup.',
  },
  'ai-chatbot-name-generator': {
    longDescription: [
      'The AI Chatbot Name Generator suggests names for your bot that fit its job and personality. Describe what the chatbot does — customer support for e-commerce, HR assistant, booking helper — pick a personality from Friendly, Professional, Playful, Helpful, Smart, or Energetic, choose 10 to 25 suggestions, and get a list of names that feel right in a chat window.',
      "Names are generated with your own OpenAI API key directly from your browser using gpt-4o-mini. The key stays in your browser's local storage and your product details are sent only to the OpenAI API, never to Exyconn servers. Each batch shows its token usage, and you can rerun with a different personality in seconds to compare directions.",
      'It is aimed at product teams and founders naming an assistant before launch: a name sets the tone for every conversation the bot has. Generating 25 options across personalities makes it easy to shortlist candidates, test them with your team, and check that the winner is free on the app stores and domains you care about.',
    ],
    features: [
      "Tailors names to the chatbot's purpose and audience",
      'Six personality directions: Friendly, Professional, Playful, Helpful, Smart, Energetic',
      '10, 15, 20, or 25 suggestions per batch',
      'Instant reruns to compare personalities side by side',
      'Runs in your browser with your OpenAI key — product plans stay off Exyconn servers',
      'Copy the whole list with one click',
    ],
    useCases: [
      'Name a customer-support bot for an online store before launch',
      'Rebrand an internal HR assistant with a friendlier identity',
      'Shortlist playful names for a consumer companion app',
      'Generate name options to run through a team poll',
    ],
    howTo: [
      'Add your OpenAI API key (stored only in your browser).',
      'Describe the chatbot purpose, e.g. "customer support for an online store".',
      'Pick a personality and how many names you want (10-25).',
      'Click Generate Names and review the list.',
      'Copy your favorites and check trademark and domain availability.',
    ],
    faqs: [
      {
        question: 'How does personality change the names?',
        answer:
          'A Playful bot gets warm, human-sounding or whimsical names, while Professional leans toward clean, trustworthy ones. Running the same brief with two personalities is the fastest way to see the range.',
      },
      {
        question: 'Are the names checked for trademarks or domains?',
        answer:
          'No — the generator only proposes ideas. Always verify trademark, domain, and app-store availability before committing to a name.',
      },
      {
        question: 'Should the name sound human or robotic?',
        answer:
          'It depends on your users: human-style names build rapport in support settings, while clearly artificial names avoid confusion about talking to a bot. State your preference in the purpose field.',
      },
      {
        question: 'Is my product idea kept confidential?',
        answer:
          'Your description travels only from your browser to the OpenAI API under your own key; Exyconn never receives it.',
      },
      {
        question: 'What does a batch of names cost?',
        answer:
          'Nothing beyond your own OpenAI usage — a 25-name batch on gpt-4o-mini typically costs well under a cent.',
      },
    ],
    keywords: [
      'chatbot name generator',
      'ai bot name ideas',
      'name for chatbot',
      'ai assistant name generator',
      'bot name generator free',
      'virtual assistant names',
      'chatbot naming tool',
    ],
    metaDescription:
      'Free chatbot name generator: describe your bot, pick a personality, and get 10-25 tailored name ideas in seconds. Runs with your own OpenAI key.',
  },
  'ai-saas-name-generator': {
    longDescription: [
      'The AI SaaS Name Generator produces brandable company and product names from a one-line description. Explain what your product does, add optional keywords for inspiration, choose a naming style — Modern, Playful, Professional, Tech, Minimal, or Bold — and set how many suggestions you want (10 to 25). The result is a list of short, pronounceable names built for a SaaS brand.',
      'The generator runs in your browser against the OpenAI API using your own key, which is stored only in local storage on your device. Your product description and keywords never pass through Exyconn servers. Batches are generated by gpt-4o-mini with token usage shown, so iterating on styles and keywords costs next to nothing.',
      'Founders use it at the blank-page stage of naming: before checking domains, you need candidates worth checking. Generating 25 Modern names, then 25 Bold ones, quickly maps the space of plausible brands around your idea. From the shortlist you can verify .com availability, trademarks, and social handles before committing to a favorite.',
    ],
    features: [
      'Names generated from your actual product description, not random syllables',
      'Six style directions: Modern, Playful, Professional, Tech, Minimal, Bold',
      'Optional keyword seeds to anchor the brand language',
      '10, 15, 20, or 25 candidates per batch with instant reruns',
      'Browser-side generation with your own OpenAI key — your idea stays off Exyconn servers',
      'One-click copy of the full list for domain checking',
    ],
    useCases: [
      'Name a new project-management SaaS before registering the domain',
      'Rebrand a side project with a more professional identity for launch',
      'Generate style-matched name options to pitch to co-founders',
      'Explore Playful vs. Minimal branding directions for the same product',
    ],
    howTo: [
      'Enter your OpenAI API key (kept only in your browser).',
      'Describe your product, e.g. "a project management tool for remote teams".',
      'Optionally add keywords, then pick a style and a batch size (10-25).',
      'Click Generate Names and scan the list.',
      'Copy the candidates and check domain, trademark, and social-handle availability.',
    ],
    faqs: [
      {
        question: 'What makes a good SaaS name?',
        answer:
          'Short, easy to say and spell, distinct in your category, and available as a .com or a credible alternative. The generator biases toward those traits; the availability checks are yours to run.',
      },
      {
        question: 'Does it check domain availability?',
        answer:
          'No. It generates candidates only — verify domains, trademarks, and app-store or social handles before committing.',
      },
      {
        question: 'How do the styles differ?',
        answer:
          'Modern and Tech produce sleek, startup-sounding names; Playful leans inventive and friendly; Professional and Minimal stay clean and conservative; Bold pushes toward distinctive, punchy options.',
      },
      {
        question: 'Is my startup idea safe to enter?',
        answer:
          'Your description goes directly from your browser to the OpenAI API with your key. Exyconn never sees or stores it.',
      },
      {
        question: 'How many batches should I generate?',
        answer:
          'Two or three batches across different styles usually surface five to ten names worth checking. Refreshing with new keywords widens the search further.',
      },
    ],
    keywords: [
      'saas name generator',
      'startup name generator',
      'ai business name generator',
      'brandable name generator free',
      'product name ideas',
      'company name generator ai',
      'tech startup names',
    ],
    metaDescription:
      'Free AI SaaS name generator: describe your product, choose a style, and get 10-25 brandable startup name ideas ready for domain checks.',
  },
};
