/**
 * The shape of the site's own legal texts (privacy, cookies, the legal-request and grievance
 * pages). Pages render these blocks; they never hold the wording themselves, so moving the
 * source to the portal later only means producing the same `LegalDocument` from there.
 */

/** A run of text, or a link inside a paragraph. */
export type LegalInline = string | Readonly<{ text: string; href: string }>;

export interface LegalListItem {
  /** Bold lead-in, e.g. "Usage Data:". */
  term?: string;
  text: string;
}

export interface LegalTopic {
  title: string;
  text: string;
  points: readonly string[];
}

export type LegalBlock =
  | Readonly<{ kind: "paragraph"; parts: readonly LegalInline[] }>
  | Readonly<{ kind: "list"; items: readonly LegalListItem[] }>
  | Readonly<{ kind: "terms"; items: readonly Required<LegalListItem>[] }>
  | Readonly<{ kind: "topics"; items: readonly LegalTopic[] }>
  | Readonly<{ kind: "note"; text: string }>;

export interface LegalSectionContent {
  /** The anchor: stable, because readers share links to a clause. */
  id: string;
  label: string;
  blocks: readonly LegalBlock[];
}

export interface LegalFaq {
  question: string;
  answer: string;
}

export interface LegalDocument {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  /** The H1 in the night band — sentence case. */
  title: string;
  /** ISO date the wording last changed — only where the page has actually recorded one. */
  updated?: string;
  /** Three to five plain-words points, each restating the document's own text. */
  summary: readonly string[];
  sections: readonly LegalSectionContent[];
  faqs?: readonly LegalFaq[];
}

/** The documents this repository still holds the wording for. */
export type LegalDocumentKey = "privacy" | "cookies" | "legal" | "grievance";
