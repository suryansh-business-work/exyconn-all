import type * as PdfMakeModule from 'pdfmake/build/pdfmake';
import type { Block } from './model';
import { loadImages, type ImageMap } from './images';
import { parseHtml } from './parse-html';
import { fileStem, saveBlob } from './save';

/** The two files a document can be downloaded as. */
export type ExportFormat = 'pdf' | 'docx';

export interface ExportOptions {
  format: ExportFormat;
  /** The document's title: the file's name, and the title in its properties. */
  title: string;
}

/**
 * pdfmake is a browser bundle with no ES default export in its types, so its dynamic import
 * is typed by hand here.
 */
type PdfMake = typeof PdfMakeModule;

/** pdfmake and its fonts are a megabyte between them — loaded only when a PDF is asked for. */
async function renderPdf(blocks: readonly Block[], images: ImageMap, title: string): Promise<Blob> {
  const [pdfModule, fontsModule, { buildPdfDefinition }] = await Promise.all([
    import('pdfmake/build/pdfmake') as unknown as Promise<{ default: PdfMake }>,
    import('pdfmake/build/vfs_fonts'),
    import('./to-pdf'),
  ]);
  const pdfMake = pdfModule.default;
  pdfMake.addVirtualFileSystem(fontsModule.default);
  return pdfMake.createPdf(buildPdfDefinition(blocks, images, title)).getBlob();
}

/** The Word writer is loaded only when a Word file is asked for. */
async function renderDocx(
  blocks: readonly Block[],
  images: ImageMap,
  title: string,
): Promise<Blob> {
  const { buildDocx } = await import('./to-docx');
  return buildDocx(blocks, images, title);
}

/**
 * Turns the editor's HTML into a PDF or Word file and saves it. Everything happens in the
 * browser: the document is parsed once, its images are fetched and converted, and the file
 * is written by pdfmake or docx. Rejects if an image cannot be loaded or a file cannot be
 * written — the caller tells the person.
 */
export async function exportRichText(
  html: string,
  { format, title }: ExportOptions,
): Promise<void> {
  const blocks = parseHtml(html);
  const images = await loadImages(blocks);
  const blob =
    format === 'pdf'
      ? await renderPdf(blocks, images, title)
      : await renderDocx(blocks, images, title);
  saveBlob(blob, `${fileStem(title)}.${format}`);
}
