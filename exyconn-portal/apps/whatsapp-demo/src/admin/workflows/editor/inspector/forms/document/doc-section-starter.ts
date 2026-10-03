import type { DocSection } from '@exyconn/wa-flow';

export type DocSectionKind = DocSection['kind'];

/** A valid section of a kind, keeping the heading already typed. */
export function docSectionStarter(kind: DocSectionKind, heading?: string): DocSection {
  if (kind === 'table') {
    return { kind, heading, columns: ['Item', 'Value'], rows: [] };
  }
  if (kind === 'text') {
    return { kind, heading, text: '' };
  }
  return { kind, heading, fields: [] };
}
