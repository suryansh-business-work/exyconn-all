import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent, MouseEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid2';
import Edit from '@mui/icons-material/Edit';
import CloudUpload from '@mui/icons-material/CloudUpload';
import NavigateBefore from '@mui/icons-material/NavigateBefore';
import NavigateNext from '@mui/icons-material/NavigateNext';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import AnnotationPanel from './AnnotationPanel';
import { TextAnnotation } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;

const SCALE = 1.5;

const hexToRgb = (hex: string) => {
  const v = parseInt(hex.replace('#', ''), 16);
  return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
};

export default function EditPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [color, setColor] = useState('#000000');
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderPage = useCallback(async (doc: pdfjsLib.PDFDocumentProxy, pageNum: number, annots: TextAnnotation[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: SCALE });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    // Overlay annotations for this page
    const pageAnnots = annots.filter((a) => a.page === pageNum);
    for (const a of pageAnnots) {
      ctx.font = `${a.size * SCALE}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle = a.color;
      // Convert PDF coords (origin bottom-left) to canvas coords (origin top-left)
      const canvasY = canvas.height - a.y * SCALE;
      ctx.fillText(a.text, a.x * SCALE, canvasY);
    }
  }, []);

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, currentPage, annotations);
  }, [pdfDoc, currentPage, annotations, renderPage]);

  const loadFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    try {
      const bytes = await f.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setFile(f);
      setAnnotations([]);
      setClickPos(null);
    } catch { setError('Failed to read PDF.'); }
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const onCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    const pdfX = Math.round(canvasX / SCALE);
    const pdfY = Math.round((canvas.height - canvasY) / SCALE);
    setClickPos({ x: pdfX, y: pdfY });
  };

  const addAnnotation = () => {
    if (!text.trim()) { setError('Enter text to add.'); return; }
    if (!clickPos) { setError('Click on the PDF to set position.'); return; }
    setAnnotations((prev) => [...prev, { text, x: clickPos.x, y: clickPos.y, size: fontSize, color, page: currentPage }]);
    setText('');
    setClickPos(null);
  };

  const removeAnnotation = (idx: number) => setAnnotations((prev) => prev.filter((_, i) => i !== idx));

  const downloadPdf = async () => {
    if (!file || !annotations.length) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      for (const a of annotations) {
        const p = pages[a.page - 1];
        if (p) p.drawText(a.text, { x: a.x, y: a.y, size: a.size, font, color: hexToRgb(a.color) });
      }
      const saved = await doc.save();
      const url = URL.createObjectURL(new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited-${file.name}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch { setError('Failed to edit PDF.'); } finally { setProcessing(false); }
  };

  return (
    <ToolLayout toolName="Edit PDF" toolIcon={<Edit />} toolColor="#6366f1">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {!file ? (
          <Paper
            sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#6366f1' : 'divider', cursor: 'pointer', transition: '0.2s', maxWidth: 600, mx: 'auto' }}
            onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <CloudUpload sx={{ fontSize: 48, color: '#6366f1', mb: 1 }} />
            <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
            <Button variant="outlined" component="label" sx={{ color: '#6366f1', borderColor: '#6366f1' }}>
              Browse Files<input hidden accept="application/pdf" type="file" onChange={onFileChange} />
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Button variant="outlined" component="label" size="small" sx={{ color: '#6366f1', borderColor: '#6366f1' }}>
                    Change PDF<input hidden accept="application/pdf" type="file" onChange={onFileChange} />
                  </Button>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size="small" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}><NavigateBefore /></IconButton>
                    <Typography variant="body2">Page {currentPage} / {totalPages}</Typography>
                    <IconButton size="small" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}><NavigateNext /></IconButton>
                  </Box>
                </Box>
                <Box sx={{ overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                  <canvas ref={canvasRef} onClick={onCanvasClick} style={{ cursor: 'crosshair', maxWidth: '100%', display: 'block', margin: '0 auto' }} />
                </Box>
                {clickPos && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>Click position (PDF): x={clickPos.x}, y={clickPos.y}</Typography>}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <AnnotationPanel
                text={text} onTextChange={setText}
                fontSize={fontSize} onFontSizeChange={setFontSize}
                color={color} onColorChange={setColor}
                clickPos={clickPos} currentPage={currentPage}
                annotations={annotations}
                onAddAnnotation={addAnnotation}
                onRemoveAnnotation={removeAnnotation}
                onDownload={downloadPdf}
                processing={processing}
              />
            </Grid>
          </Grid>
        )}

        <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}
