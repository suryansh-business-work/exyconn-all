import { EMAIL } from '@exyconn/regex';

/** Cells of a CSV (or a plain list): split on line breaks, commas, semicolons and tabs. */
const CELL_SEPARATOR = /[\n\r,;\t]+/;

/** A cell without the quotes a spreadsheet put around it (scanned, so no regex backtracking). */
function unquoted(cell: string): string {
  let start = 0;
  let end = cell.length;
  while (start < end && cell[start] === '"') {
    start += 1;
  }
  while (end > start && cell[end - 1] === '"') {
    end -= 1;
  }
  return cell.slice(start, end);
}

/**
 * Every distinct email address in an uploaded file, whatever column it is in: a CRM export, a
 * mailing list or one address per line all work. Lower-cased, so a repeat is one address.
 */
export function emailsInCsv(text: string): string[] {
  const cells = text.split(CELL_SEPARATOR).map((cell) => unquoted(cell.trim()).trim());
  return [...new Set(cells.filter((cell) => EMAIL.test(cell)).map((cell) => cell.toLowerCase()))];
}
