import type { ToolDetailsMap } from './types';

/** Detail content for the "ai-writing" tool category. Keyed by tool id from toolsData. */
export const aiWritingToolDetails: ToolDetailsMap = {
  'ai-text-generator': {
    longDescription: [
      'The AI Text Generator turns a short topic prompt into ready-to-use copy. Choose one of six content types — blog introduction, social media post, product description, email subject lines, tagline/slogan or meta description — pick a tone such as professional, casual, persuasive, informative or witty, and generate a draft you can copy with a single click.',
      'Out of the box, the tool analyzes your topic on the Exyconn server and returns readability metrics (character, word and sentence counts plus a readability grade) together with concrete writing suggestions for that content type. For full generative output, add your own OpenAI API key in the Secrets drawer; the generator then uses GPT to write original content matched to your chosen type and tone.',
      'It is built for marketers, founders and content teams who need a fast first draft instead of a blank page. Because each content type has its own conventions, the guidance is format-aware — email subject lines stay short, meta descriptions stay within search-snippet length, and taglines stay punchy — so the output needs less editing before it goes live.',
    ],
    features: [
      'Six content types: blog intro, social post, product description, email subject lines, tagline and meta description',
      'Five selectable tones, from professional to witty',
      'Readability analysis: character, word and sentence counts plus a readability grade',
      'Actionable, format-specific writing suggestions for every topic',
      'Bring-your-own OpenAI API key for full GPT-powered generation',
      'One-click copy of the generated output',
    ],
    useCases: [
      'Draft a blog introduction before writing the full article',
      'Generate several email subject lines to A/B test a campaign',
      'Write product descriptions for an online store listing',
      'Create a tagline for a new brand or landing page',
      'Produce a meta description that fits the Google snippet length',
    ],
    howTo: [
      'Enter your topic or subject in the input field',
      'Select a content type from the dropdown',
      'Pick a tone that matches your brand voice',
      'Click Generate and wait a few seconds',
      'Review the result and click Copy to use it',
    ],
    faqs: [
      {
        question: 'Is the AI Text Generator free?',
        answer:
          'Yes. Topic analysis, readability metrics and writing suggestions are free with no sign-up. Full GPT generation only requires your own OpenAI API key, added via the Secrets drawer.',
      },
      {
        question: 'Do I need an OpenAI API key?',
        answer:
          'Not for the built-in analysis and suggestions. Add a key in the Secrets drawer (key icon at the top) if you want GPT to write complete original copy for you.',
      },
      {
        question: 'What content types can it write?',
        answer:
          'Blog introductions, social media posts, product descriptions, email subject lines, taglines/slogans and SEO meta descriptions.',
      },
      {
        question: 'Is my topic stored anywhere?',
        answer:
          'No. Your topic is sent to the Exyconn server only to run the analysis, is processed in memory, and is not saved or used to train any model.',
      },
      {
        question: 'Can I control how the text sounds?',
        answer:
          'Yes — choose between professional, casual, persuasive, informative and witty tones before generating.',
      },
    ],
    keywords: [
      'ai text generator',
      'free ai writer',
      'ai content generator',
      'blog intro generator',
      'product description generator',
      'email subject line generator',
      'tagline generator',
      'ai copywriting tool',
    ],
    metaDescription:
      'Free AI text generator: create blog intros, social posts, product descriptions, email subject lines and taglines in your chosen tone. No sign-up needed.',
  },

  'paragraph-rewriter': {
    longDescription: [
      'The Paragraph Rewriter analyzes any paragraph you paste and shows you exactly how to tighten it. It reports word count, sentence count and average sentence length, grades the readability as Easy, Moderate or Hard, and lists concrete rewrite suggestions — flagging overlong sentences, filler phrases and structural issues that push the reading level up.',
      'Analysis runs on the Exyconn server in a single request: your text is processed transiently to compute the metrics and suggestions and is never stored. If you add an OpenAI API key in the Secrets drawer, the tool goes further and produces a fully rewritten, professional-style version of your paragraph instead of suggestions alone.',
      'Use it whenever a paragraph reads clumsily but you cannot pin down why — a blog section, an About page, a cover-letter paragraph or a report abstract. The metrics give you an objective target, such as shorter sentences and an easier readability grade, and the suggestions tell you which specific edits will get you there fastest.',
    ],
    features: [
      'Instant word, sentence and average-sentence-length statistics',
      'Readability rating: Easy, Moderate or Hard',
      'Concrete, per-paragraph rewrite suggestions',
      'Works on any text from 10 characters up — no length cap in the UI',
      'Optional GPT-powered rewriting with your own OpenAI API key',
      'Text is analyzed transiently on the server and never stored',
    ],
    useCases: [
      'Tighten a blog paragraph before hitting publish',
      'Simplify an About page so visitors actually read it',
      'Polish a cover-letter paragraph to sound more professional',
      'Bring a report abstract down to an easier reading grade',
      'Check marketing copy for sentences that run too long',
    ],
    howTo: [
      'Paste your paragraph into the text box',
      'Click Analyze Text',
      'Review the word, sentence and readability stats',
      'Apply the listed suggestions to your draft',
      'Re-run the analysis until the readability rating improves',
    ],
    faqs: [
      {
        question: 'Is the Paragraph Rewriter free to use?',
        answer:
          'Yes, completely. Analysis, readability grading and rewrite suggestions are free with no account or word limit imposed by the tool.',
      },
      {
        question: 'Does it rewrite the paragraph for me?',
        answer:
          'By default it returns metrics and specific suggestions you apply yourself. With an OpenAI API key added in the Secrets drawer, it produces a rewritten version automatically.',
      },
      {
        question: 'Is my text saved on your servers?',
        answer:
          'No. The paragraph is sent to the Exyconn server for one analysis pass, processed in memory and discarded — it is never stored or logged.',
      },
      {
        question: 'How is readability calculated?',
        answer:
          'The server derives it from sentence length and word complexity, then buckets the score into Easy, Moderate or Hard so you get an at-a-glance verdict.',
      },
      {
        question: 'Is there a minimum text length?',
        answer:
          'Yes, 10 characters — anything shorter has too little signal to analyze meaningfully.',
      },
    ],
    keywords: [
      'paragraph rewriter',
      'rewrite paragraph online free',
      'paragraph checker',
      'readability checker',
      'improve paragraph writing',
      'sentence length analyzer',
      'make text easier to read',
    ],
    metaDescription:
      'Free paragraph rewriter: paste text to get readability scores, sentence stats and concrete rewrite suggestions that make your writing clearer.',
  },

  'paraphrasing-tool': {
    longDescription: [
      'The Paraphrasing Tool helps you say the same thing better. Paste any passage and it analyzes tone, structure and readability on the Exyconn server, returning word and sentence counts, an Easy/Moderate/Hard readability rating, and targeted suggestions for rewording — where to vary sentence openings, replace repeated phrasing, and restructure clauses without changing the meaning.',
      'Unlike blind synonym-swappers, the tool starts from measurable analysis: it shows you what is actually wrong with the passage before proposing how to rephrase it, so the result stays natural instead of thesaurus-mangled. Add your own OpenAI API key in the Secrets drawer and it will also generate a full AI paraphrase of the text in one step.',
      'It suits students restating sources in their own words, marketers refreshing existing copy for a new channel, and non-native English writers who want their text to read more fluently. Your text is processed transiently for the analysis and never stored, so it is safe to use with unpublished or confidential drafts.',
    ],
    features: [
      'Tone, structure and readability analysis of any pasted text',
      'Word count, sentence count and Easy/Moderate/Hard readability rating',
      'Targeted rewording suggestions that preserve the original meaning',
      'Analysis-first approach — no thesaurus-style word mangling',
      'Optional one-step AI paraphrasing via your own OpenAI API key',
      'Text is never stored — processed in memory on the Exyconn server',
    ],
    useCases: [
      'Restate a source passage in your own words for an essay',
      'Refresh website copy for a new campaign without changing its message',
      'Rewrite a paragraph that repeats the same sentence structure',
      'Smooth out text written by a non-native English speaker',
      'Rephrase an email that sounds harsher than intended',
    ],
    howTo: [
      'Paste your text into the input box (at least 10 characters)',
      'Click Analyze & Suggest',
      'Check the word count, sentence count and readability rating',
      'Follow the suggestions to reword weak or repetitive passages',
      'Re-analyze the revised text to confirm it reads better',
    ],
    faqs: [
      {
        question: 'Is this paraphrasing tool free?',
        answer:
          'Yes. The analysis and rewording suggestions are entirely free with no sign-up. AI-generated paraphrases only require your own OpenAI API key.',
      },
      {
        question: 'Will paraphrasing change the meaning of my text?',
        answer:
          'No — the suggestions focus on structure, tone and word variety while keeping the meaning intact, and you stay in control of every edit.',
      },
      {
        question: 'Is my text kept or shared?',
        answer:
          'No. It is sent to the Exyconn server for a single analysis pass, handled in memory and discarded immediately — never stored, logged or shared.',
      },
      {
        question: 'How is this different from the Paragraph Rewriter?',
        answer:
          'The Paragraph Rewriter targets clarity and reading grade of one paragraph; the Paraphrasing Tool focuses on rewording — saying the same thing differently while keeping the meaning.',
      },
      {
        question: 'Can it paraphrase automatically?',
        answer:
          'Yes, when you add an OpenAI API key in the Secrets drawer the tool generates a complete AI paraphrase in addition to the analysis.',
      },
    ],
    keywords: [
      'paraphrasing tool',
      'free paraphrasing tool online',
      'rephrase text',
      'reword my paragraph',
      'paraphrase without plagiarizing',
      'rewrite text in my own words',
      'sentence rephraser',
    ],
    metaDescription:
      'Free online paraphrasing tool: analyze tone, structure and readability, then get targeted suggestions to reword text without changing its meaning.',
  },

  'sentence-rewriter': {
    longDescription: [
      'The Sentence Rewriter zooms in on the smallest unit of your writing: the sentence. Type or paste one or more sentences and it analyzes them on the Exyconn server, returning word count, sentence count, average words per sentence and an Easy/Moderate/Hard readability rating, followed by improvement suggestions that show which sentences to shorten, split or sharpen.',
      'Average sentence length is the metric most writers never check, yet it is the fastest predictor of hard-to-read text — anything consistently above 20 words per sentence loses readers. The tool surfaces that number instantly so you can watch it drop as you edit. With an OpenAI API key added in the Secrets drawer, it will also rewrite the sentences for you using GPT.',
      'It is handy for anyone who edits at the sentence level: copywriters trimming headlines and CTAs, students fixing run-on sentences flagged by a teacher, and support or docs teams making instructions unambiguous. Your sentences are processed transiently on the Exyconn server for the analysis and are never stored or logged.',
    ],
    features: [
      'Per-passage stats: words, sentences and average words per sentence',
      'Easy/Moderate/Hard readability rating at a glance',
      'Suggestions pinpointing sentences to shorten, split or clarify',
      'Fast single-request analysis — results in about a second',
      'Optional GPT-powered rewriting via your own OpenAI API key',
      'Sentences are analyzed in memory and never stored',
    ],
    useCases: [
      'Fix a run-on sentence a reviewer flagged in your essay',
      'Trim a headline or call-to-action to its most impactful form',
      'Break a 40-word legal-style sentence into readable pieces',
      'Make step-by-step instructions unambiguous for documentation',
      'Check that email opening lines read quickly on mobile',
    ],
    howTo: [
      'Type or paste your sentence(s) into the input box',
      'Click Analyze Sentences',
      'Check the average words-per-sentence and readability chips',
      'Edit using the improvement suggestions shown on the right',
      'Re-run until the readability rating reaches Easy',
    ],
    faqs: [
      {
        question: 'Is the Sentence Rewriter free?',
        answer:
          'Yes — analysis, sentence statistics and improvement suggestions are free, with no account and no usage limit imposed by the tool.',
      },
      {
        question: 'Can I analyze multiple sentences at once?',
        answer:
          'Yes. Paste a whole passage and the tool reports per-passage totals plus the average sentence length across all of them.',
      },
      {
        question: 'What counts as a good average sentence length?',
        answer:
          'Roughly 15–20 words per sentence keeps most writing at an Easy rating; sustained averages above 25 usually push text into Moderate or Hard.',
      },
      {
        question: 'Does it store what I type?',
        answer:
          'No. Text goes to the Exyconn server for one analysis pass, is processed in memory and immediately discarded.',
      },
      {
        question: 'Can it rewrite sentences automatically?',
        answer:
          'Yes — add your own OpenAI API key in the Secrets drawer and the tool uses GPT to produce rewritten versions alongside the analysis.',
      },
    ],
    keywords: [
      'sentence rewriter',
      'rewrite my sentence free',
      'fix run-on sentences',
      'sentence checker online',
      'make sentences clearer',
      'shorten a sentence',
      'average sentence length checker',
    ],
    metaDescription:
      'Free sentence rewriter: spot long, hard-to-read sentences instantly and get suggestions that make every line clearer and more impactful.',
  },

  'summary-generator': {
    longDescription: [
      'The Summary Generator condenses long text into its key sentences. Paste an article, report, essay or transcript, click Generate Summary, and get back a concise version together with hard numbers: the compression ratio, how many of the original sentences were kept, and the character counts before and after — so you know exactly how much was cut.',
      'Summarization is extractive: the Exyconn server scores every sentence in your text by signal — position, term frequency and connection to the main topic — and keeps the highest-scoring ones in their original order. Because the summary reuses your own sentences verbatim, nothing is misquoted or invented, which matters when summarizing reports, research or anything you will cite.',
      'It is built for students skimming reading lists, professionals digesting long reports, and content teams writing TL;DRs, abstracts or newsletter blurbs from full articles. Your text is processed transiently on the server for the one summarization pass and is never stored, so confidential drafts and internal documents are safe to summarize.',
    ],
    features: [
      'One-click extractive summary of any pasted text',
      'Compression ratio showing how much shorter the summary is',
      'Kept-vs-total sentence count and before/after character counts',
      'Sentences are reused verbatim — nothing is invented or misquoted',
      'Copy Summary button for instant reuse',
      'Text is processed transiently and never stored',
    ],
    useCases: [
      'Produce a TL;DR for a long blog post or newsletter',
      'Digest a lengthy report before a meeting',
      'Draft the abstract of an essay or paper from its full text',
      'Condense meeting or interview transcripts into key points',
      'Shorten a press release for a social media caption',
    ],
    howTo: [
      'Paste your article, report or transcript into the text box',
      'Click Generate Summary',
      'Check the compression ratio and sentence-count chips',
      'Read the summary to confirm it keeps the key points',
      'Click Copy Summary to use it anywhere',
    ],
    faqs: [
      {
        question: 'Is the Summary Generator free?',
        answer:
          'Yes — unlimited summaries, no sign-up, no word-count paywall.',
      },
      {
        question: 'How does it decide what to keep?',
        answer:
          'It scores each sentence by position, term frequency and relevance to the overall topic, then keeps the top-scoring sentences in their original order.',
      },
      {
        question: 'Will the summary contain made-up text?',
        answer:
          'No. The summary is extractive — it only reuses sentences that already exist in your text, so nothing is paraphrased, invented or misquoted.',
      },
      {
        question: 'Is my document stored after summarizing?',
        answer:
          'No. The text is sent to the Exyconn server for a single summarization pass, processed in memory and discarded — safe for confidential material.',
      },
      {
        question: 'How long can the input text be?',
        answer:
          'Anything from 10 characters up; longer inputs simply yield a higher compression ratio. Very long documents are best summarized section by section.',
      },
    ],
    keywords: [
      'summary generator',
      'free text summarizer',
      'summarize article online',
      'tldr generator',
      'abstract generator',
      'summarize long text',
      'extractive summarization tool',
    ],
    metaDescription:
      'Free summary generator: condense articles, reports and essays into key sentences with an exact compression ratio. No sign-up, nothing stored.',
  },

  'gbp-description-generator': {
    longDescription: [
      'The GBP Description Generator writes ready-to-paste "from the business" descriptions for your Google Business Profile. Enter your business name, type and location, optionally add comma-separated services and unique selling points, and the tool returns multiple description variants — each with a live character count checked against Google\'s 750-character limit.',
      'Every variant is composed from your actual inputs, so the copy names your services and city naturally instead of resorting to generic filler — the pattern Google\'s local guidelines reward. A green or red chip on each variant shows at a glance whether it fits within the 750-character cap, and a per-variant Copy button puts the text on your clipboard ready for the Business Profile editor.',
      'Alongside the variants you get a checklist of GBP-specific writing tips, such as leading with what makes you different and avoiding URLs or promotional offers that violate Google\'s description policy. It is aimed at local business owners setting up their first listing, and at agencies and SEOs who manage descriptions across many client profiles.',
    ],
    features: [
      'Multiple description variants generated from one set of inputs',
      'Live character count per variant against Google\'s 750-character limit',
      'Green/red limit indicator so an over-length variant is obvious',
      'Uses your real services, location and unique points — no generic filler',
      'GBP-specific writing tips alongside the generated copy',
      'One-click copy per variant, ready for the Business Profile editor',
    ],
    useCases: [
      'Write the description for a brand-new Google Business Profile',
      'Refresh a listing whose description no longer mentions current services',
      'Produce distinct on-policy descriptions for multiple client listings',
      'Localize a franchise description to each branch\'s city',
      'Rework a description that was rejected for exceeding the limit',
    ],
    howTo: [
      'Enter your business name, business type and location (all three required)',
      'Optionally list services and unique points, separated by commas',
      'Click Generate Descriptions',
      'Compare the variants and check each one\'s 750-character chip',
      'Click Copy on your favorite and paste it into your Google Business Profile',
    ],
    faqs: [
      {
        question: 'Is the GBP Description Generator free?',
        answer:
          'Yes — generate as many description variants as you like with no sign-up or payment.',
      },
      {
        question: 'What is the character limit for a Google Business Profile description?',
        answer:
          '750 characters, and only the first ~250 show before "More". The tool counts every variant against the 750 cap and flags any that exceed it.',
      },
      {
        question: 'Does Google allow generated descriptions?',
        answer:
          'Yes, as long as the content is accurate and follows the guidelines: no URLs, no promotional offers, no misleading claims. The built-in tips reflect those rules — always review before publishing.',
      },
      {
        question: 'Which fields are required?',
        answer:
          'Business name, business type and location. Services and unique points are optional but make the variants noticeably more specific and keyword-relevant.',
      },
      {
        question: 'Is my business information stored?',
        answer:
          'No. Your inputs are sent to the Exyconn server only to compose the variants, processed in memory and discarded — nothing is saved.',
      },
    ],
    keywords: [
      'google business profile description generator',
      'gbp description generator',
      'google my business description examples',
      'gmb description generator free',
      'business description generator',
      '750 character business description',
      'local seo description writer',
    ],
    metaDescription:
      'Free Google Business Profile description generator: keyword-rich variants under the 750-character limit, built from your real services and city.',
  },
};
