import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid2';
import Crop from '@mui/icons-material/Crop';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const formatSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

export default function CropPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [top, setTop] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [applyMode, setApplyMode] = useState('all');
  const [targetPage, setTargetPage] = useState(1);

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

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const cropPdf = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pages = doc.getPages();
      pages.forEach((page, i) => {
        if (applyMode === 'specific' && i !== targetPage - 1) return;
        const { width, height } = page.getSize();
        page.setCropBox(left, bottom, width - left - right, height - top - bottom);
      });
      setResult(await doc.save());
    } catch { setError('Failed to crop PDF.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `cropped-${file?.name ?? 'document.pdf'}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="Crop PDF" toolIcon={<Crop />} toolColor="#f97316">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#f97316' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#f97316', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" sx={{ color: '#f97316', borderColor: '#f97316' }}>
                Browse Files
                <input hidden accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {file && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="body2"><strong>{file.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Size: {formatSize(file.size)} · Pages: {pageCount}</Typography>
              </Paper>
            )}

            <PdfPreview file={file} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Crop Margins (points)</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}><TextField fullWidth label="Top" type="number" value={top} onChange={(e) => setTop(Number(e.target.value))} size="small" /></Grid>
                <Grid size={{ xs: 6 }}><TextField fullWidth label="Bottom" type="number" value={bottom} onChange={(e) => setBottom(Number(e.target.value))} size="small" /></Grid>
                <Grid size={{ xs: 6 }}><TextField fullWidth label="Left" type="number" value={left} onChange={(e) => setLeft(Number(e.target.value))} size="small" /></Grid>
                <Grid size={{ xs: 6 }}><TextField fullWidth label="Right" type="number" value={right} onChange={(e) => setRight(Number(e.target.value))} size="small" /></Grid>
              </Grid>
              <TextField select fullWidth label="Apply to" value={applyMode} onChange={(e) => setApplyMode(e.target.value)} size="small" sx={{ mt: 2 }}>
                <MenuItem value="all">All Pages</MenuItem>
                <MenuItem value="specific">Specific Page</MenuItem>
              </TextField>
              {applyMode === 'specific' && (
                <TextField fullWidth label="Page Number" type="number" value={targetPage} onChange={(e) => setTargetPage(Number(e.target.value))}
                  size="small" sx={{ mt: 2 }} inputProps={{ min: 1, max: pageCount }} />
              )}
              {processing && <LinearProgress sx={{ mt: 2, mb: 1 }} color="warning" />}
              <Button variant="contained" fullWidth onClick={cropPdf} disabled={!file || processing}
                sx={{ mt: 2, bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}>
                {processing ? 'Cropping…' : 'Crop PDF'}
              </Button>
              {result && (
                <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download} sx={{ mt: 2, color: '#f97316', borderColor: '#f97316' }}>
                  Download Cropped PDF
                </Button>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}
