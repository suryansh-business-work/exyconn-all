import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Opens a PDF for display. pdf.js takes ownership of the buffer it is given, so it gets a
 * copy and the original bytes stay whole for writing the edits back.
 */
export function loadPdf(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  return getDocument({ data: bytes.slice() }).promise;
}

export type { PDFDocumentProxy };
