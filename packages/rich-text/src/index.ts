/**
 * `@exyconn/rich-text` — the one rich-text editor every Exyconn form uses.
 *
 * TipTap behind an MUI toolbar: headings, fonts and sizes, marks, colour and highlight, alignment,
 * bullet / numbered / check lists, quotes, links, resizable tables, images (uploaded
 * through the host, including paste and drop), an HTML source view and a word count.
 * The value is an HTML string; bind it to a form with the shell's `RhfRichText`.
 *
 * `exportRichText` turns that HTML into a PDF or a Word file in the browser — tables, lists,
 * marks, colours, fonts and images included — and `DownloadMenu` is the button that offers it.
 */
export { RichTextEditor } from './RichTextEditor';
export {
  DownloadMenu,
  type DownloadMenuLabels,
  type DownloadMenuProps,
} from './export/DownloadMenu';
export { exportRichText, type ExportFormat, type ExportOptions } from './export';
export type { RichTextEditorProps, UploadImage } from './types';
