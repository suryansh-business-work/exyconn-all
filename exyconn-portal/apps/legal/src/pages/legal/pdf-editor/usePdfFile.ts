import { useEffect, useState } from 'react';
import { loadPdf, type PDFDocumentProxy } from './pdfjs';

interface PdfFile {
  bytes: Uint8Array | null;
  doc: PDFDocumentProxy | null;
  error: string | null;
}

/** Fetches the PDF behind a URL and opens it; the raw bytes are kept for saving edits. */
export function usePdfFile(url: string | null): PdfFile {
  const [file, setFile] = useState<PdfFile>({ bytes: null, doc: null, error: null });

  useEffect(() => {
    if (!url) {
      return undefined;
    }
    let cancelled = false;
    setFile({ bytes: null, doc: null, error: null });
    const open = async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`The file could not be downloaded (${response.status}).`);
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      const doc = await loadPdf(bytes);
      if (!cancelled) {
        setFile({ bytes, doc, error: null });
      }
    };
    open().catch((error: unknown) => {
      if (!cancelled) {
        setFile({
          bytes: null,
          doc: null,
          error: error instanceof Error ? error.message : 'The PDF could not be opened.',
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return file;
}
