import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid2';
import LockOpen from '@mui/icons-material/LockOpen';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const formatSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

export default function UnlockPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);

  const loadFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    setFile(f); setResult(null); setPageCount(0);
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  }, [loadFile]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = '';
  };

  const unlock = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const loadOptions = password ? { password } : undefined;
      const doc = await PDFDocument.load(bytes, loadOptions as Parameters<typeof PDFDocument.load>[1]);
      setPageCount(doc.getPageCount());
      const saved = await doc.save();
      setResult(saved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(`Failed to unlock PDF: ${msg}`);
      }
    } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url;
    a.download = `unlocked-${file?.name ?? 'document.pdf'}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="Unlock PDF" toolIcon={<LockOpen />} toolColor="#ef4444">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#ef4444' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#ef4444', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop Protected PDF</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" color="error">
                Browse Files<input hidden accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {file && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="body2"><strong>{file.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Size: {formatSize(file.size)}</Typography>
              </Paper>
            )}
            {file && (
              <Box sx={{ mt: 2 }}>
                <PdfPreview file={file} />
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <TextField label="PDF Password" type="password" fullWidth size="small"
                value={password} onChange={(e) => setPassword(e.target.value)}
                helperText="Enter the password used to protect this PDF" />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {processing && <LinearProgress sx={{ mb: 2 }} color="error" />}
            <Button variant="contained" fullWidth sx={{ bgcolor: '#ef4444', mb: 2, '&:hover': { bgcolor: '#dc2626' } }}
              onClick={unlock} disabled={!file || processing}>
              {processing ? 'Unlocking...' : 'Unlock PDF'}
            </Button>
            {result && (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  PDF unlocked successfully! {pageCount} page{pageCount !== 1 ? 's' : ''} found.
                </Alert>
                <Button variant="outlined" fullWidth startIcon={<Download />} color="error" onClick={download}>
                  Download Unlocked PDF
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
        <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}
