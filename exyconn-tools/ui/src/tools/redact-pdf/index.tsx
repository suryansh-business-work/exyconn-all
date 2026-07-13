import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Grid from '@mui/material/Grid2';
import HighlightOff from '@mui/icons-material/HighlightOff';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import Delete from '@mui/icons-material/Delete';
import Add from '@mui/icons-material/Add';
import { PDFDocument, rgb } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const COLOR = '#ef4444';
const fmt = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

interface Redaction { page: number; x: number; y: number; width: number; height: number; }

export default function RedactPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [redactions, setRedactions] = useState<Redaction[]>([]);
  const [page, setPage] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [w, setW] = useState(100);
  const [h, setH] = useState(20);

  const loadFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    try {
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
      setFile(f); setResult(null); setRedactions([]);
    } catch { setError('Failed to read PDF.'); }
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const addRedaction = () => {
    if (page < 1 || page > pageCount) { setError(`Page must be between 1 and ${pageCount}`); return; }
    if (w <= 0 || h <= 0) { setError('Width and height must be positive'); return; }
    setRedactions((prev) => [...prev, { page, x, y, width: w, height: h }]);
  };

  const removeRedaction = (i: number) => setRedactions((prev) => prev.filter((_, idx) => idx !== i));

  const applyRedactions = async () => {
    if (!file || redactions.length === 0) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pages = doc.getPages();
      redactions.forEach((r) => {
        const p = pages[r.page - 1];
        if (p) p.drawRectangle({ x: r.x, y: r.y, width: r.width, height: r.height, color: rgb(0, 0, 0) });
      });
      setResult(await doc.save());
    } catch { setError('Failed to apply redactions.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `redacted-${file?.name ?? 'document.pdf'}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="Redact PDF" toolIcon={<HighlightOff />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? COLOR : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
              <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
                Browse Files<input hidden accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {file && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="body2"><strong>{file.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">{fmt(file.size)} · {pageCount} page(s)</Typography>
              </Paper>
            )}
            {file && <PdfPreview file={file} />}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Redaction Areas</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>Redaction draws black rectangles over content. For complete content removal, reprocess with a professional tool.</Alert>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid size={{ xs: 4, sm: 2 }}><TextField fullWidth label="Page" type="number" size="small" value={page} onChange={(e) => setPage(Number(e.target.value))} inputProps={{ min: 1, max: pageCount }} /></Grid>
                <Grid size={{ xs: 4, sm: 2 }}><TextField fullWidth label="X (pt)" type="number" size="small" value={x} onChange={(e) => setX(Number(e.target.value))} /></Grid>
                <Grid size={{ xs: 4, sm: 2 }}><TextField fullWidth label="Y (pt)" type="number" size="small" value={y} onChange={(e) => setY(Number(e.target.value))} /></Grid>
                <Grid size={{ xs: 4, sm: 2 }}><TextField fullWidth label="Width" type="number" size="small" value={w} onChange={(e) => setW(Number(e.target.value))} /></Grid>
                <Grid size={{ xs: 4, sm: 2 }}><TextField fullWidth label="Height" type="number" size="small" value={h} onChange={(e) => setH(Number(e.target.value))} /></Grid>
                <Grid size={{ xs: 4, sm: 2 }} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button variant="contained" fullWidth startIcon={<Add />} onClick={addRedaction} disabled={!file} sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#dc2626' } }}>Add</Button>
                </Grid>
              </Grid>
              {redactions.length > 0 && (
                <List dense sx={{ mb: 2, maxHeight: 180, overflow: 'auto' }}>
                  {redactions.map((r, i) => (
                    <ListItem key={i} secondaryAction={<IconButton edge="end" onClick={() => removeRedaction(i)}><Delete fontSize="small" /></IconButton>}>
                      <ListItemText primary={`Page ${r.page}: (${r.x}, ${r.y}) ${r.width}×${r.height} pt`} />
                    </ListItem>
                  ))}
                </List>
              )}
              {processing && <LinearProgress sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: COLOR } }} />}
              <Button variant="contained" fullWidth onClick={applyRedactions} disabled={!file || redactions.length === 0 || processing}
                sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#dc2626' }, mb: 1 }}>
                {processing ? 'Applying…' : `Apply ${redactions.length} Redaction(s) & Download`}
              </Button>
              {result && <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download} sx={{ color: COLOR, borderColor: COLOR }}>Download Redacted PDF</Button>}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}><Alert severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar>
    </ToolLayout>
  );
}
