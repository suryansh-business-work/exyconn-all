import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Grid from '@mui/material/Grid2';
import CallSplit from '@mui/icons-material/CallSplit';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const formatSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

function parseRanges(input: string, max: number): number[][] {
  const groups: number[][] = [];
  for (const part of input.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number);
      if (isNaN(a) || isNaN(b) || a < 1 || b > max || a > b) throw new Error(`Invalid range: ${part}`);
      groups.push(Array.from({ length: b - a + 1 }, (_, i) => a + i));
    } else {
      const n = Number(part);
      if (isNaN(n) || n < 1 || n > max) throw new Error(`Invalid page: ${part}`);
      groups.push([n]);
    }
  }
  return groups;
}

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState('');
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<{ name: string; data: Uint8Array }[]>([]);

  const loadFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    setFile(f); setResults([]);
    try { const doc = await PDFDocument.load(await f.arrayBuffer()); setPageCount(doc.getPageCount()); }
    catch { setError('Could not read PDF.'); }
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const split = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const srcBytes = await file.arrayBuffer();
      const groups: number[][] = mode === 'all'
        ? Array.from({ length: pageCount }, (_, i) => [i + 1])
        : parseRanges(customRange, pageCount);
      const out: { name: string; data: Uint8Array }[] = [];
      for (let g = 0; g < groups.length; g++) {
        const newDoc = await PDFDocument.create();
        const src = await PDFDocument.load(srcBytes);
        const pages = await newDoc.copyPages(src, groups[g].map((p) => p - 1));
        pages.forEach((p) => newDoc.addPage(p));
        const label = groups[g].length === 1 ? `page-${groups[g][0]}` : `pages-${groups[g][0]}-${groups[g][groups[g].length - 1]}`;
        out.push({ name: `${label}.pdf`, data: await newDoc.save() });
      }
      setResults(out);
    } catch (err) { setError(err instanceof Error ? err.message : 'Split failed.'); } finally { setProcessing(false); }
  };

  const downloadOne = (r: { name: string; data: Uint8Array }) => {
    const url = URL.createObjectURL(new Blob([r.data.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = r.name; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="Split PDF" toolIcon={<CallSplit />} toolColor="#f97316">
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
              <Typography variant="h6" gutterBottom>Split Options</Typography>
              <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as 'all' | 'custom')}>
                <FormControlLabel value="all" control={<Radio />} label="All pages (one PDF per page)" />
                <FormControlLabel value="custom" control={<Radio />} label="Custom range" />
              </RadioGroup>
              {mode === 'custom' && (
                <TextField fullWidth size="small" label="Page ranges" placeholder="e.g. 1-3, 5, 7-10"
                  value={customRange} onChange={(e) => setCustomRange(e.target.value)} sx={{ mt: 1, mb: 2 }} />
              )}
              {processing && <LinearProgress sx={{ my: 2 }} color="warning" />}
              <Button variant="contained" fullWidth onClick={split} disabled={!file || processing}
                sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, mt: 2 }}>
                {processing ? 'Splitting…' : 'Split PDF'}
              </Button>
            </Paper>

            {results.length > 0 && (
              <Paper sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {results.map((r, i) => (
                    <ListItem key={i} secondaryAction={
                      <IconButton size="small" onClick={() => downloadOne(r)}><Download fontSize="small" /></IconButton>
                    }>
                      <ListItemText primary={r.name} secondary={formatSize(r.data.length)} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>
        </Grid>
        <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}

