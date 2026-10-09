import { useMemo } from 'react';
import { useRichTextExport, type ExportFormat } from '@exyconn/shell/hooks/useRichTextExport';

interface DownloadableRow {
  id: string;
  title: string;
}

type SaveBody = ReturnType<typeof useRichTextExport>;

const logDownloadFailure = (error: unknown) => console.error('Download failed', error);

/** The handler for one format: fetch the row's body, then hand it to the exporter. */
function downloadAs<Row extends DownloadableRow>(
  save: SaveBody,
  fetchBody: (id: string) => Promise<string>,
  format: ExportFormat,
) {
  return (row: Row) => {
    save(() => fetchBody(row.id), row.title, format).catch(logDownloadFailure);
  };
}

/**
 * Row handlers for the PDF and Word buttons. A grid row has no text on it, so each download
 * fetches the body first; `useRichTextExport` tells the person if that or the file fails.
 */
export function useBodyDownloads<Row extends DownloadableRow>(
  fetchBody: (id: string) => Promise<string>,
): Record<ExportFormat, (row: Row) => void> {
  const save = useRichTextExport();
  return useMemo(
    () => ({
      pdf: downloadAs<Row>(save, fetchBody, 'pdf'),
      docx: downloadAs<Row>(save, fetchBody, 'docx'),
    }),
    [save, fetchBody],
  );
}
