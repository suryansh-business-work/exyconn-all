/**
 * Per-tool descriptive content that powers the on-page details sections
 * (About / Features / How to / Use cases / FAQ) and the SEO meta tags —
 * both at runtime (ToolLayout) and at build time (scripts/prerender.ts).
 *
 * Pure data: NO React/icon imports here so the prerender script can load it
 * in Node without a DOM.
 */
export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolDetailContent {
  /** 2-3 plain-text paragraphs describing the tool in depth. */
  longDescription: string[];
  /** 4-8 concise feature bullets. */
  features: string[];
  /** 3-6 real-world use cases. */
  useCases: string[];
  /** 3-6 ordered "how to use" steps. */
  howTo: string[];
  /** 4-6 questions users actually ask, with direct answers. */
  faqs: ToolFaq[];
  /** 5-10 SEO keywords/phrases. */
  keywords: string[];
  /** <=160 chars, hand-written meta description. */
  metaDescription: string;
  /** Optional override; defaults to "<name> — Free Online Tool | Exyconn Tools". */
  metaTitle?: string;
}

export type ToolDetailsMap = Record<string, ToolDetailContent>;
