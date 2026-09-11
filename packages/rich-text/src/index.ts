/**
 * `@exyconn/rich-text` — the one rich-text editor every Exyconn form uses.
 *
 * TipTap behind an MUI toolbar: headings, marks, colour and highlight, alignment,
 * bullet / numbered / check lists, quotes, links, resizable tables, images (uploaded
 * through the host, including paste and drop), an HTML source view and a word count.
 * The value is an HTML string; bind it to a form with the shell's `RhfRichText`.
 */
export { RichTextEditor } from './RichTextEditor';
export type { RichTextEditorProps, UploadImage } from './types';
