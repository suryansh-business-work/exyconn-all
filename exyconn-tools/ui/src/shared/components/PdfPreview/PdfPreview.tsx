import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, Paper, IconButton, Skeleton } from '@mui/material';
import { NavigateBefore, NavigateNext, PictureAsPdf } from '@mui/icons-material';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href;

interface PdfPreviewProps {
  file: File | null;
  maxHeight?: number;
  showPageNav?: boolean;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ file, maxHeight = 360, showPageNav = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPdfDoc(null);
      setTotalPages(0);
      setCurrentPage(1);
      return;
    }
    let cancelled = false;
    setLoading(true);
    file.arrayBuffer().then((buf) => {
      if (cancelled) return;
      return pdfjsLib.getDocument({ data: buf }).promise;
    }).then((doc) => {
      if (cancelled || !doc) return;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
    }).catch(() => {
      setPdfDoc(null);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [file]);

  const renderPage = useCallback(async (doc: pdfjsLib.PDFDocumentProxy, pageNum: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const page = await doc.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(maxHeight / baseViewport.height, 1.5);
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    } catch { /* ignore render errors */ }
  }, [maxHeight]);

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, currentPage);
  }, [pdfDoc, currentPage, renderPage]);

  if (!file) return null;

  if (loading) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
        <Skeleton variant="text" width="50%" sx={{ mx: 'auto', mt: 1 }} />
      </Paper>
    );
  }

  if (!pdfDoc) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <PictureAsPdf sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">Unable to preview PDF</Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ maxWidth: '100%', maxHeight, display: 'block' }}
        />
      </Box>
      {showPageNav && totalPages > 1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
          <IconButton size="small" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
            <NavigateBefore fontSize="small" />
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            Page {currentPage} of {totalPages}
          </Typography>
          <IconButton size="small" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
            <NavigateNext fontSize="small" />
          </IconButton>
        </Box>
      )}
      {totalPages === 1 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          1 page
        </Typography>
      )}
    </Paper>
  );
};

export default PdfPreview;
