/**
 * The editor's document as plain data — what both file renderers (PDF and Word) are written
 * against. The HTML is parsed into this once, so the two formats cannot disagree about what
 * a heading, a merged table cell or a checked task is.
 */

export type Align = 'left' | 'center' | 'right' | 'justify';

/** A run of text with the marks the editor can put on it. */
export interface TextRun {
  kind: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  sub?: boolean;
  sup?: boolean;
  /** `#rrggbb`. */
  color?: string;
  /** `#rrggbb`. */
  highlight?: string;
  link?: string;
  /** In CSS pixels, as the editor stores it. */
  fontSize?: number;
  fontFamily?: string;
}

export interface LineBreak {
  kind: 'break';
}

export type Inline = TextRun | LineBreak;

/** The marks a run inherits from the elements around it. */
export type Marks = Omit<TextRun, 'kind' | 'text'>;

export interface ListItem {
  blocks: Block[];
  /** Set only on a task list's items. */
  checked?: boolean;
}

export interface TableCell {
  header: boolean;
  colSpan: number;
  rowSpan: number;
  blocks: Block[];
}

export type Block =
  | { kind: 'paragraph'; inlines: Inline[]; align?: Align }
  | { kind: 'heading'; level: 1 | 2 | 3 | 4; inlines: Inline[]; align?: Align }
  | { kind: 'list'; ordered: boolean; items: ListItem[] }
  | { kind: 'quote'; blocks: Block[] }
  | { kind: 'code'; text: string }
  | { kind: 'rule' }
  | { kind: 'image'; src: string; alt: string; width?: number }
  | { kind: 'table'; rows: TableCell[][] };
