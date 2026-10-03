import { useMemo } from 'react';
import { useRichTextExport, type ExportFormat } from '@exyconn/shell/hooks/useRichTextExport';

interface DownloadableRow {
  id: string;
  title: string;
}

/**
 * Row handlers for the PDF and Word buttons. A grid row has no text on it, so each download
 * fetches the body first; `useRichTextExport` tells the person if that or the file fails.
 */
export function useBodyDownloads<Row extends DownloadableRow>(
  fetchBody: (id: string) => Promise<string>,
): Record<ExportFormat, (row: Row) => void> {
  const save = useRichTextExport();
  return useMemo(() => {
    const run = (format: ExportFormat) => (row: Row) => {
      save(() => fetchBody(row.id), row.title, format).catch((error: unknown) =>
        console.error('Download failed', error),
      );
    };
    return { pdf: run('pdf'), docx: run('docx') };
  }, [save, fetchBody]);
}
