import { cellText } from './cellText';

export interface CsvColumn<Row> {
  header: string;
  value: (row: Row) => unknown;
}

/**
 * A spreadsheet runs a cell that starts with one of these as a formula (CSV injection), so
 * such text is prefixed with `'`. Numbers are left alone: `-5` is a value, not a formula.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

/** RFC 4180 quoting: wrap when the cell holds a comma, quote or line break; double the quotes. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw = value instanceof Date ? value.toISOString() : cellText(value);
  const text = typeof value !== 'number' && FORMULA_START.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Rows to CSV text with a header line. Pure, so it is unit tested without a browser. */
export function toCsv<Row>(rows: Row[], columns: CsvColumn<Row>[]): string {
  const header = columns.map((c) => cell(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => cell(c.value(row))).join(','));
  return [header, ...body].join('\r\n');
}

/** Hands the browser a file to save. The BOM makes Excel read UTF-8 correctly. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * The delimiter of a file, read off its header line: a comma, unless the header has no comma
 * but has a semicolon (Excel in many European locales) or a tab (a TSV), in that order.
 */
function detectDelimiter(text: string): string {
  const end = text.search(/[\r\n]/);
  const header = end === -1 ? text : text.slice(0, end);
  if (header.includes(',')) return ',';
  if (header.includes(';')) return ';';
  if (header.includes('\t')) return '\t';
  return ',';
}

/** A quoted field from just after its opening quote: `""` is one quote. Returns where it ends. */
function readQuoted(text: string, start: number): { value: string; next: number } {
  let value = '';
  let index = start;
  while (index < text.length) {
    const quote = text.indexOf('"', index);
    if (quote === -1) {
      return { value: value + text.slice(index), next: text.length };
    }
    value += text.slice(index, quote);
    if (text[quote + 1] !== '"') {
      return { value, next: quote + 1 };
    }
    value += '"';
    index = quote + 2;
  }
  return { value, next: index };
}

/** True for a record that is one empty cell: a blank line. */
function isBlank(row: string[]): boolean {
  return row.length === 1 && row[0] === '';
}

/**
 * CSV text to rows of cells (RFC 4180): quoted fields may hold the delimiter, line breaks and
 * `""` for a quote; lines end in CRLF, LF or CR; a UTF-8 BOM is dropped, and so are blank lines
 * at the end of the file. The delimiter is detected from the header line (see
 * `detectDelimiter`). Cells are returned as written — trimming is the caller's choice.
 */
export function parseCsv(text: string): string[][] {
  const source = text.startsWith('﻿') ? text.slice(1) : text;
  const delimiter = detectDelimiter(source);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char === '"' && field === '') {
      const quoted = readQuoted(source, index + 1);
      field = quoted.value;
      index = quoted.next;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
      index += 1;
    } else if (char === '\r' || char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      index += char === '\r' && source[index + 1] === '\n' ? 2 : 1;
    } else {
      field += char;
      index += 1;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  while (rows.length > 0 && isBlank(rows[rows.length - 1])) {
    rows.pop();
  }
  return rows;
}
