import { downloadCsv, toCsv, type CsvColumn } from '@exyconn/shell/utils/csv';
import { FIRST_DATA_LINE, type CsvFile } from './csvFile';
import type { ImportIssue } from './useImportRun';

interface IssueRow {
  cells: readonly string[];
  issue: ImportIssue;
}

interface IssueHeadings {
  line: string;
  issue: string;
}

/**
 * The rows that had a problem, as they were in the file, with the line and the reason added —
 * fix them in a spreadsheet and import that file again.
 */
export function downloadIssuesCsv(
  file: CsvFile,
  issues: readonly ImportIssue[],
  headings: IssueHeadings,
): void {
  const rows: IssueRow[] = issues.map((issue) => ({
    cells: file.rows[issue.row - FIRST_DATA_LINE] ?? [],
    issue,
  }));
  const columns: CsvColumn<IssueRow>[] = [
    ...file.headers.map((header, index) => ({
      header,
      value: (row: IssueRow) => row.cells[index] ?? '',
    })),
    { header: headings.line, value: (row) => row.issue.row },
    { header: headings.issue, value: (row) => row.issue.message },
  ];
  const base = file.name.replace(/\.csv$/i, '');
  downloadCsv(`${base}-issues`, toCsv(rows, columns));
}
