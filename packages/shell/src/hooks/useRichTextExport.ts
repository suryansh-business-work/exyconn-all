import { useCallback } from 'react';
import { exportRichText, type ExportFormat } from '@exyconn/rich-text';
import { useNotify } from '@/components/feedback/NotificationProvider';

export type { ExportFormat } from '@exyconn/rich-text';

/** Where the HTML comes from: in hand (an open form), or fetched first (a grid row). */
export type RichTextSource = string | (() => Promise<string>);

/**
 * Saves rich-text HTML as a PDF or a Word file. Never rejects: an empty document, a failed
 * fetch, an image that will not load — each is told to the person, and the failure itself is
 * logged for Tech > Logs.
 */
export function useRichTextExport() {
  const notify = useNotify();
  return useCallback(
    async (source: RichTextSource, title: string, format: ExportFormat): Promise<void> => {
      try {
        const html = typeof source === 'string' ? source : await source();
        if (!html.trim()) {
          notify('There is nothing to download yet. Write the document first.', 'info');
          return;
        }
        await exportRichText(html, { format, title });
      } catch (error) {
        console.error('Rich-text export failed', error);
        notify(
          'The file could not be created. Check that its images still open, then try again.',
          'error',
        );
      }
    },
    [notify],
  );
}
