import { downloadCsv, toCsv } from '@exyconn/shell/utils/csv';

/** An empty CSV whose headings are the given labels, for a source that builds its own sample. */
export function downloadCsvTemplate(fileName: string, headings: readonly string[]): void {
  downloadCsv(
    fileName,
    toCsv<never>(
      [],
      headings.map((header) => ({ header, value: () => '' })),
    ),
  );
}
