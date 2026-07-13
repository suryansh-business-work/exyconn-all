import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Grid from '@mui/material/Grid2';
import RotateRight from '@mui/icons-material/RotateRight';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { PDFDocument, degrees } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const formatSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [angle, setAngle] = useState<number>(90);
  const [scope, setScope] = useState<'all' | 'custom'>('all');
  const [customPages, setCustomPages] = useState('');
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Uint8Array | null>(null);

  const loadFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    setFile(f); setResult(null);
    try { const doc = await PDFDocument.load(await f.arrayBuffer()); setPageCount(doc.getPageCount()); }
    catch { setError('Could not read PDF.'); }
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const parsePages = (): number[] => {
    if (scope === 'all') return Array.from({ length: pageCount }, (_, i) => i);
    const pages = new Set<number>();
    for (const part of customPages.split(',').map((s) => s.trim()).filter(Boolean)) {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number);
        if (isNaN(a) || isNaN(b) || a < 1 || b > pageCount || a > b) throw new Error(`Invalid range: ${part}`);
        for (let i = a; i <= b; i++) pages.add(i - 1);
      } else {
        const n = Number(part);
        if (isNaN(n) || n < 1 || n > pageCount) throw new Error(`Invalid page: ${part}`);
        pages.add(n - 1);
      }
    }
    return [...pages];
  };

  const rotate = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const indices = parsePages();
      const allPages = doc.getPages();
      indices.forEach((i) => {
        const page = allPages[i];
        page.setRotation(degrees(page.getRotation().angle + angle));
      });
      setResult(await doc.save());
    } catch (err) { setError(err instanceof Error ? err.message : 'Rotation failed.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `rotated-${file?.name ?? 'document.pdf'}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="Rotate PDF" toolIcon={<RotateRight />} toolColor="#f97316">
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
                <Typography variant="body2"><strong>{file.name}</strong> — {formatSize(file.size)}</Typography>
                <Typography variant="body2" color="text.secondary">Total pages: {pageCount}</Typography>
              </Paper>
            )}

            <PdfPreview file={file} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Rotation Options</Typography>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Angle</Typography>
              <ToggleButtonGroup exclusive value={angle} onChange={(_, v) => v !== null && setAngle(v)} sx={{ mb: 2 }}>
                <ToggleButton value={90}>90°</ToggleButton>
                <ToggleButton value={180}>180°</ToggleButton>
                <ToggleButton value={270}>270°</ToggleButton>
              </ToggleButtonGroup>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Pages</Typography>
              <RadioGroup value={scope} onChange={(e) => setScope(e.target.value as 'all' | 'custom')}>
                <FormControlLabel value="all" control={<Radio />} label="All pages" />
                <FormControlLabel value="custom" control={<Radio />} label="Specific pages" />
              </RadioGroup>
              {scope === 'custom' && (
                <TextField fullWidth size="small" label="Pages" placeholder="e.g. 1-3, 5"
                  value={customPages} onChange={(e) => setCustomPages(e.target.value)} sx={{ mt: 1 }} />
              )}

              {processing && <LinearProgress sx={{ my: 2 }} color="warning" />}
              <Button variant="contained" fullWidth onClick={rotate} disabled={!file || processing}
                sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, mt: 2 }}>
                {processing ? 'Rotating…' : 'Rotate PDF'}
              </Button>
              {result && (
                <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download} sx={{ mt: 2, color: '#f97316', borderColor: '#f97316' }}>
                  Download Rotated PDF
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
