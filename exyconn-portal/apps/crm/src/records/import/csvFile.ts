import type { Interpolations } from '@exyconn/i18n';
import { downloadCsv, parseCsv, toCsv } from '@exyconn/shell/utils/csv';

/** The largest file the wizard reads; bigger files are split by the person first. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_DATA_ROWS = 50_000;
/** The file line of the first data row: the header is line 1. */
export const FIRST_DATA_LINE = 2;

export interface CsvFile {
  name: string;
  headers: string[];
  /** Data rows, in file order; row `i` is file line `FIRST_DATA_LINE + i`. */
  rows: string[][];
}

/** Why a file was refused, as English copy for `t()` with its values. */
export interface CsvFileError {
  message: string;
  values?: Interpolations;
}

export type CsvFileResult = { ok: true; file: CsvFile } | { ok: false; error: CsvFileError };

/** Reads and checks a chosen file: size, a header row, at least one and at most 50,000 rows. */
export async function readCsvFile(file: File): Promise<CsvFileResult> {
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: {
        message: '{file} is larger than 10 MB. Split it into smaller files.',
        values: { file: file.name },
      },
    };
  }
  const [header = [], ...rows] = parseCsv(await file.text());
  const headers = header.map((cell) => cell.trim());
  if (headers.every((cell) => cell === '')) {
    return {
      ok: false,
      error: {
        message: '{file} has no header row. The first line must name the columns.',
        values: { file: file.name },
      },
    };
  }
  if (rows.length === 0) {
    return {
      ok: false,
      error: { message: '{file} has no rows to import.', values: { file: file.name } },
    };
  }
  if (rows.length > MAX_DATA_ROWS) {
    return {
      ok: false,
      error: {
        message:
          '{file} has {count} rows; up to 50,000 can be imported at once. Split it into smaller files.',
        values: { file: file.name, count: rows.length },
      },
    };
  }
  return { ok: true, file: { name: file.name, headers, rows } };
}

/** An empty file whose headings are the importable properties, ready to fill in. */
export function downloadTemplate(fileName: string, labels: readonly string[]): void {
  downloadCsv(
    fileName,
    toCsv<never>(
      [],
      labels.map((header) => ({ header, value: () => '' })),
    ),
  );
}
