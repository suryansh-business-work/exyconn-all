/** What the editor's toolbar can put on a page. */
export type PdfTool =
  'select' | 'text' | 'draw' | 'rect' | 'highlight' | 'whiteout' | 'image' | 'signature';

/**
 * Where an annotation sits, as fractions of its page (0 to 1, from the top-left), so it stays
 * put whatever the zoom, and maps straight onto the PDF's own points when it is saved.
 */
interface Placed {
  id: string;
  /** 0-based page index. */
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type PdfAnnotation =
  | (Placed & { kind: 'text'; text: string; fontSize: number; color: string })
  | (Placed & { kind: 'rect'; color: string })
  | (Placed & { kind: 'highlight' })
  | (Placed & { kind: 'whiteout' })
  | (Placed & { kind: 'draw'; points: Array<[number, number]>; color: string })
  | (Placed & { kind: 'image'; src: string });

export type PdfAnnotationKind = PdfAnnotation['kind'];

/** A picture waiting to be placed: its data URL and height-to-width ratio. */
export interface PdfStamp {
  src: string;
  aspect: number;
}

/** The ink colours a document can be marked up in. Content, not theme: they print as-is. */
export const PDF_INKS = [
  { value: '#111827', label: 'Black' },
  { value: '#1d4ed8', label: 'Blue' },
  { value: '#b91c1c', label: 'Red' },
  { value: '#15803d', label: 'Green' },
] as const;

/** Text sizes offered, in PDF points. */
export const PDF_FONT_SIZES = [10, 12, 14, 18, 24] as const;

/** The highlighter's colour and strength, on screen and in the saved file alike. */
export const HIGHLIGHT = { color: '#facc15', opacity: 0.35 } as const;
