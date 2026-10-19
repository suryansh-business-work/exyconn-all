import ExcelJS from 'exceljs';
import { cellText, parseCsv, toCsv } from '@exyconn/csv';
import { badRequest } from '../../utils/errors';

export type TableFileFormat = 'CSV' | 'XLSX';
/** What one exported cell holds; XLSX keeps numbers and booleans typed, CSV writes them as text. */
export type ExportCell = string | number | boolean;

/** A generated file, as the client saves it. */
export interface TableFile {
  fileName: string;
  mimeType: string;
  contentBase64: string;
  /** Data rows in the first sheet, header excluded. */
  rowCount: number;
}

/** One sheet: a header row, then the data rows cell for cell. CSV writes only the first. */
export interface Sheet {
  name: string;
  headers: string[];
  rows: ExportCell[][];
}

/** A file read for import: its trimmed header row, then its data rows (blank ones included). */
export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

const MIME_TYPES: Record<TableFileFormat, string> = {
  CSV: 'text/csv;charset=utf-8',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const EXTENSIONS: Record<TableFileFormat, string> = { CSV: 'csv', XLSX: 'xlsx' };
const CSV_EXTENSIONS: ReadonlySet<string> = new Set(['csv', 'tsv', 'txt']);
/** Makes Excel read a CSV as UTF-8. */
const BOM = '﻿';
const MIN_COLUMN_WIDTH = 10;
const MAX_COLUMN_WIDTH = 60;
/** Excel refuses a longer sheet name. */
const MAX_SHEET_NAME = 31;

export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 50_000;

/** A cell as the file shows it: lists joined with `; `, which import splits on again. */
export function exportCell(value: unknown): ExportCell {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(cellText).join('; ');
  }
  return cellText(value);
}

/** `Client list` on 16 Oct 2026 as XLSX → `client-list-2026-10-16.xlsx`. */
export function fileNameFor(base: string, format: TableFileFormat, today = new Date()): string {
  const slug = base
    .trim()
    .toLowerCase()
    .replaceAll(/[^\w-]+/g, '-')
    .replaceAll(/(?:^-+)|(?:-+$)/g, '');
  const stamp = today.toISOString().slice(0, 10);
  return `${slug || 'export'}-${stamp}.${EXTENSIONS[format]}`;
}

function writeCsv(sheet: Sheet): Buffer {
  const columns = sheet.headers.map((header, index) => ({
    header,
    value: (row: ExportCell[]) => row[index],
  }));
  return Buffer.from(BOM + toCsv(sheet.rows, columns), 'utf8');
}

function columnWidth(header: string): number {
  return Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, header.length + 2));
}

async function writeXlsx(sheets: readonly Sheet[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name.slice(0, MAX_SHEET_NAME), {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    worksheet.columns = sheet.headers.map((header) => ({ header, width: columnWidth(header) }));
    worksheet.getRow(1).font = { bold: true };
    worksheet.addRows(sheet.rows);
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/** Writes the sheets as a CSV (the first sheet) or an XLSX workbook, ready to send. */
export async function writeTableFile(
  format: TableFileFormat,
  baseName: string,
  sheets: readonly [Sheet, ...Sheet[]],
): Promise<TableFile> {
  const content = format === 'CSV' ? writeCsv(sheets[0]) : await writeXlsx(sheets);
  return {
    fileName: fileNameFor(baseName, format),
    mimeType: MIME_TYPES[format],
    contentBase64: content.toString('base64'),
    rowCount: sheets[0].rows.length,
  };
}

function cellString(cell: ExcelJS.Cell): string {
  return cell.value instanceof Date ? cell.value.toISOString() : cell.text;
}

async function readXlsx(content: Buffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(content as unknown as ExcelJS.Buffer);
  } catch {
    badRequest('The file is not a readable Excel workbook.');
  }
  const [sheet] = workbook.worksheets;
  const rows: string[][] = [];
  const width = sheet?.columnCount ?? 0;
  sheet?.eachRow({ includeEmpty: true }, (row) => {
    rows.push(Array.from({ length: width }, (_, index) => cellString(row.getCell(index + 1))));
  });
  return rows;
}

function readGrid(fileName: string, content: Buffer): Promise<string[][]> | string[][] {
  const extension = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();
  if (extension === 'xlsx') {
    return readXlsx(content);
  }
  if (CSV_EXTENSIONS.has(extension)) {
    return parseCsv(content.toString('utf8'));
  }
  badRequest('Choose a .csv or .xlsx file.');
}

/** Reads an uploaded CSV or XLSX (its first sheet) and checks its size, header and row count. */
export async function parseTableFile(fileName: string, content: Buffer): Promise<ParsedTable> {
  if (content.length > MAX_IMPORT_FILE_BYTES) {
    badRequest('The file is larger than 10 MB. Split it into smaller files.');
  }
  const [header = [], ...rows] = await readGrid(fileName, content);
  const headers = header.map((cell) => cell.trim());
  if (headers.every((cell) => cell === '')) {
    badRequest('The file has no header row. The first line must name the columns.');
  }
  // Blank rows stay in place so a row's index still names its line in the file.
  if (!rows.some((row) => row.some((cell) => cell.trim() !== ''))) {
    badRequest('The file has no rows to import.');
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    badRequest(
      `The file has ${rows.length} rows; up to ${MAX_IMPORT_ROWS} can be imported at once. Split it into smaller files.`,
    );
  }
  return { headers, rows };
}
