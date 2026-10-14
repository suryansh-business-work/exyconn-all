import { EMAIL } from '@exyconn/regex';

/** Cells of a CSV (or a plain list): split on line breaks, commas, semicolons and tabs. */
const CELL_SEPARATOR = /[\n\r,;\t]+/;

/** Quotes a spreadsheet put around a cell. */
const QUOTES = /(?:^"+)|(?:"+$)/g;

/**
 * Every distinct email address in an uploaded file, whatever column it is in: a CRM export, a
 * mailing list or one address per line all work. Lower-cased, so a repeat is one address.
 */
export function emailsInCsv(text: string): string[] {
  const cells = text.split(CELL_SEPARATOR).map((cell) => cell.trim().replaceAll(QUOTES, '').trim());
  return [...new Set(cells.filter((cell) => EMAIL.test(cell)).map((cell) => cell.toLowerCase()))];
}
