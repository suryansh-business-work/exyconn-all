import { useT } from '@exyconn/i18n';
import { DownloadMenu } from '@exyconn/rich-text';
import { useRichTextExport } from '@/hooks/useRichTextExport';

interface RichTextDownloadProps {
  /** The file's name and the title in its properties. */
  title: string;
  /** The document as it is now — unsaved edits included. */
  html: string;
}

/** "Download" → PDF or Word, for a rich-text document open on the screen. */
export function RichTextDownload({ title, html }: Readonly<RichTextDownloadProps>) {
  const t = useT();
  const save = useRichTextExport();
  return (
    <DownloadMenu
      labels={{ button: t('Download'), pdf: t('PDF'), docx: t('Word document') }}
      disabled={!html.trim()}
      onSelect={(format) => save(html, title, format)}
    />
  );
}
