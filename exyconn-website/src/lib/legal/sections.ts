import type { LegalDocument } from "./types";

/** A section's 1-based number in its document, for the sections a page renders itself. */
export function sectionNumber(doc: LegalDocument, id: string): number {
  const index = doc.sections.findIndex((section) => section.id === id);
  if (index < 0) {
    throw new Error(`No section "${id}" in "${doc.title}".`);
  }
  return index + 1;
}

/** The section with this id — its label is the heading the page renders. */
export function sectionById(doc: LegalDocument, id: string) {
  return doc.sections[sectionNumber(doc, id) - 1];
}
