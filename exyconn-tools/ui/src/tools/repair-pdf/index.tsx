import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import BrokenImage from '@mui/icons-material/BrokenImage';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const COLOR = '#f59e0b';
const fmt = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

export default function RepairPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [failMessage, setFailMessage] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [metadata, setMetadata] = useState({ title: '', author: '', producer: '' });
  const [result, setResult] = useState<Uint8Array | null>(null);

  const loadFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) { setError('Please select a PDF file.'); return; }
    setFile(f); setResult(null); setStatus('idle'); setFailMessage('');
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const repair = async () => {
    if (!file) return;
    setProcessing(true); setStatus('idle');
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
      setMetadata({ title: doc.getTitle() ?? '—', author: doc.getAuthor() ?? '—', producer: doc.getProducer() ?? '—' });
      const saved = await doc.save();
      setResult(saved);
      setStatus('success');
    } catch (err) {
      setStatus('failed');
      setFailMessage(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `repaired-${file?.name ?? 'document.pdf'}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="Repair PDF" toolIcon={<BrokenImage />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? COLOR : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
              <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Upload even potentially corrupt PDFs</Typography>
              <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
                Browse Files<input hidden accept="application/pdf,.pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {file && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="body2"><strong>{file.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Size: {fmt(file.size)}</Typography>
              </Paper>
            )}
            {file && <PdfPreview file={file} />}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Repair Status</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>Re-serializing a PDF can fix minor structural corruption by rebuilding the file's object table.</Alert>
              {processing && <LinearProgress sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: COLOR } }} />}
              <Button variant="contained" fullWidth onClick={repair} disabled={!file || processing} sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#d97706' }, mb: 2 }}>
                {processing ? 'Repairing…' : 'Attempt Repair'}
              </Button>
              {status === 'success' && (
                <Box>
                  <Chip icon={<CheckCircle />} label="PDF loaded successfully — re-serialized for integrity" color="success" sx={{ mb: 2, width: '100%' }} />
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="body2">Pages: <strong>{pageCount}</strong></Typography>
                    <Typography variant="body2">Title: <strong>{metadata.title}</strong></Typography>
                    <Typography variant="body2">Author: <strong>{metadata.author}</strong></Typography>
                    <Typography variant="body2">Producer: <strong>{metadata.producer}</strong></Typography>
                    <Typography variant="body2">Original: <strong>{fmt(file!.size)}</strong> → Repaired: <strong>{result ? fmt(result.length) : '—'}</strong></Typography>
                  </Paper>
                  <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download} sx={{ color: COLOR, borderColor: COLOR }}>Download Repaired PDF</Button>
                </Box>
              )}
              {status === 'failed' && (
                <Box>
                  <Chip icon={<ErrorOutline />} label="Failed to load — PDF may be severely corrupted" color="error" sx={{ mb: 2, width: '100%' }} />
                  <Alert severity="error">{failMessage}</Alert>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}><Alert severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar>
    </ToolLayout>
  );
}
