import { app, BrowserWindow, dialog } from 'electron';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { HoursReportFile, ReportExport, SavedReport } from '@shared/types';

/** The one format offered. A spreadsheet opens it, and so does anything else. */
const CSV_FILTER = { name: 'CSV spreadsheet', extensions: ['csv'] };
const XLSX_FILTER = { name: 'Excel workbook', extensions: ['xlsx'] };

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
  return saveWithDialog(window, report.fileName, CSV_FILTER, (path) =>
    writeFile(path, report.content, 'utf8'),
  );
}

/**
 * Writes the month's hours report — the XLSX the portal generates — to a file the employee
 * picks. The bytes stay in the main process: the renderer only learns where they went.
 */
export async function saveHoursReportFile(
  window: BrowserWindow | null,
  report: HoursReportFile,
): Promise<SavedReport> {
  return saveWithDialog(window, report.fileName, XLSX_FILTER, (path) =>
    writeFile(path, Buffer.from(report.contentBase64, 'base64')),
  );
}

/** Asks where to save, then writes there; a cancelled dialog answers with a null path. */
async function saveWithDialog(
  window: BrowserWindow | null,
  fileName: string,
  filter: { name: string; extensions: string[] },
  write: (path: string) => Promise<void>,
): Promise<SavedReport> {
  const defaultPath = join(app.getPath('downloads'), fileName);
  const result = window
    ? await dialog.showSaveDialog(window, { defaultPath, filters: [filter] })
    : await dialog.showSaveDialog({ defaultPath, filters: [filter] });

  if (result.canceled || !result.filePath) {
    return { path: null };
  }

  await write(result.filePath);
  return { path: result.filePath };
}
