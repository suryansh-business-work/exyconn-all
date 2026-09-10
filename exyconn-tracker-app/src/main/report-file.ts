import { BrowserWindow, dialog } from 'electron';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { app } from 'electron';
import type { ReportExport, SavedReport } from '@shared/types';

/** The one format offered. A spreadsheet opens it, and so does anything else. */
const CSV_FILTER = { name: 'CSV spreadsheet', extensions: ['csv'] };

/**
 * Writes the employee's own report to a file they choose.
 *
 * They can already SEE their tracked time in the app and in the portal, and could see it
 * nowhere else — a figure somebody is measured on that they cannot take away with them is a
 * figure they cannot check against their own records, or attach to a question about it.
 *
 * The renderer composes the file (it owns the formatting every other view already uses); this
 * only asks where to put it and puts it there. A cancelled dialog is a normal outcome, not an
 * error: it answers with a null path and the caller says nothing.
 */
export async function saveReportFile(
  window: BrowserWindow | null,
  report: ReportExport,
): Promise<SavedReport> {
  const defaultPath = join(app.getPath('downloads'), report.fileName);
  const result = window
    ? await dialog.showSaveDialog(window, { defaultPath, filters: [CSV_FILTER] })
    : await dialog.showSaveDialog({ defaultPath, filters: [CSV_FILTER] });

  if (result.canceled || !result.filePath) {
    return { path: null };
  }

  await writeFile(result.filePath, report.content, 'utf8');
  return { path: result.filePath };
}
