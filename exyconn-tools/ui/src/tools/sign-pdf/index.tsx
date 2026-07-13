import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid2';
import Create from '@mui/icons-material/Create';
import CloudUpload from '@mui/icons-material/CloudUpload';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';
import SignatureControls from './SignatureControls';

const SIG_SIZES: Record<string, number> = { small: 80, medium: 140, large: 200 };

export default function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [position, setPosition] = useState('bottom-right');
  const [pageTarget, setPageTarget] = useState('last');
  const [sigSize, setSigSize] = useState('medium');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    try {
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
      setFile(f);
      setResult(null);
    } catch { setError('Failed to read PDF.'); }
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  }, [loadFile]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
    e.target.value = '';
  };

  const signPdf = async () => {
    if (!file || !canvasRef.current) return;
    setProcessing(true);
    try {
      const pngDataUrl = canvasRef.current.toDataURL('image/png');
      const base64 = pngDataUrl.split(',')[1];
      const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pngImage = await doc.embedPng(pngBytes);
      const dim = SIG_SIZES[sigSize];
      const ratio = pngImage.width / pngImage.height;
      const w = dim;
      const h = dim / ratio;
      const pages = doc.getPages();
      const targets = pageTarget === 'first' ? [0] : pageTarget === 'last' ? [pages.length - 1] : pages.map((_, i) => i);
      for (const idx of targets) {
        const page = pages[idx];
        if (!page) continue;
        const { width, height } = page.getSize();
        let x = 30, y = 30;
        if (position === 'bottom-right') x = width - w - 30;
        else if (position === 'center') { x = (width - w) / 2; y = (height - h) / 2; }
        page.drawImage(pngImage, { x, y, width: w, height: h });
      }
      setResult(await doc.save());
    } catch { setError('Failed to sign PDF.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signed-${file?.name ?? 'document.pdf'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="Sign PDF" toolIcon={<Create />} toolColor="#0ea5e9">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#0ea5e9' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
              <CloudUpload sx={{ fontSize: 48, color: '#0ea5e9', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" sx={{ color: '#0ea5e9', borderColor: '#0ea5e9' }}>
                Browse Files<input hidden accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {file && <Paper sx={{ p: 2, mt: 2 }}><Typography variant="body2"><strong>{file.name}</strong> · {pageCount} page(s)</Typography></Paper>}
            {file && <PdfPreview file={file} />}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <SignatureControls
              position={position} onPositionChange={setPosition}
              pageTarget={pageTarget} onPageTargetChange={setPageTarget}
              sigSize={sigSize} onSigSizeChange={setSigSize}
              processing={processing} hasFile={!!file} hasResult={!!result}
              onSign={signPdf} onDownload={download}
              canvasRef={canvasRef}
            />
          </Grid>
        </Grid>
        <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}
