import { ExternalHyperlink, ShadingType, TextRun, type ParagraphChild } from 'docx';
import type { Inline } from './model';
import { INK, PX_TO_PT, WORD_FONTS } from './print';

/** Word measures text in half-points. */
const HALF_POINTS = 2;

/** Word writes colours as `RRGGBB`, without the hash. */
export const wordColour = (hex: string | undefined) => hex?.slice(1);

/** A fill behind text or a paragraph, in Word's terms. */
export const fill = (hex: string) => ({
  type: ShadingType.CLEAR,
  color: 'auto',
  fill: wordColour(hex),
});

/** Formatting a whole block forces onto its runs — a header cell is bold throughout. */
export interface RunOverrides {
  bold?: boolean;
}

function textRun(run: Extract<Inline, { kind: 'text' }>, overrides: RunOverrides): TextRun {
  const highlight = run.highlight ?? (run.code ? INK.codeFill : undefined);
  return new TextRun({
    text: run.text,
    bold: run.bold || overrides.bold,
    italics: run.italic,
    underline: run.underline ? {} : undefined,
    strike: run.strike,
    subScript: run.sub,
    superScript: run.sup,
    color: wordColour(run.color),
    shading: highlight ? fill(highlight) : undefined,
    size: run.fontSize ? Math.round(run.fontSize * PX_TO_PT * HALF_POINTS) : undefined,
    font: run.code ? WORD_FONTS.mono : run.fontFamily,
    style: run.link ? 'Hyperlink' : undefined,
  });
}

/** One inline as Word content: a run, a line break, or a run inside a hyperlink. */
export function wordInline(inline: Inline, overrides: RunOverrides = {}): ParagraphChild {
  if (inline.kind === 'break') {
    return new TextRun({ break: 1 });
  }
  const run = textRun(inline, overrides);
  return inline.link ? new ExternalHyperlink({ link: inline.link, children: [run] }) : run;
}
