import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import type { ReportExport } from '@exyconn/tracker-core';

/** What became of a share: handed to the share sheet, or this phone has none to hand it to. */
export type ShareOutcome = 'shared' | 'unavailable';

/**
 * Hands the month's CSV to the OS share sheet — the phone's version of the desktop's save
 * dialog: the employee saves it to Files, mails it, or sends it on, as they choose.
 *
 * Written to the cache directory first, because a share sheet takes a file, not a string. The
 * cache is right for it: the file is a hand-off, and the OS may clear it once it is gone.
 */
export async function shareReport(
  report: ReportExport,
  dialogTitle: string,
): Promise<ShareOutcome> {
  if (!(await isAvailableAsync())) {
    return 'unavailable';
  }
  const file = new File(Paths.cache, report.fileName);
  file.create({ overwrite: true });
  file.write(report.content);
  await shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle,
  });
  return 'shared';
}
