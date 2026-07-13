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
import Lock from '@mui/icons-material/Lock';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import Info from '@mui/icons-material/Info';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const formatSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

export default function ProtectPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [result, setResult] = useState<Uint8Array | null>(null);

  const loadFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    setFile(f); setResult(null);
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  }, [loadFile]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = '';
  };

  const protect = async () => {
    if (!file) return;
    if (!userPassword && !ownerPassword) { setError('Enter at least one password.'); return; }
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);
      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      pages.forEach((p) => newDoc.addPage(p));
      const saved = await newDoc.save();
      setResult(saved);
    } catch {
      setError('Failed to process PDF.');
    } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url;
    a.download = `protected-${file?.name ?? 'document.pdf'}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="Protect PDF" toolIcon={<Lock />} toolColor="#22c55e">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#22c55e' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#22c55e', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" color="success">
                Browse Files<input hidden accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {file && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="body2"><strong>{file.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Size: {formatSize(file.size)}</Typography>
              </Paper>
            )}

            <PdfPreview file={file} />
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="User Password (to open)" type="password" fullWidth size="small"
                value={userPassword} onChange={(e) => setUserPassword(e.target.value)} />
              <TextField label="Owner Password (to edit)" type="password" fullWidth size="small"
                value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Alert severity="info" icon={<Info />} sx={{ mb: 2 }}>
              Browser-based PDF encryption is limited. pdf-lib does not natively support password encryption.
              The PDF will be re-saved (copies all pages), but <strong>no actual password lock</strong> is applied.
              For strong encryption, use a desktop tool such as Adobe Acrobat or qpdf.
            </Alert>
            {processing && <LinearProgress sx={{ mb: 2 }} color="success" />}
            <Button variant="contained" fullWidth sx={{ bgcolor: '#22c55e', mb: 2, '&:hover': { bgcolor: '#16a34a' } }}
              onClick={protect} disabled={!file || processing}>
              {processing ? 'Processing...' : 'Process PDF'}
            </Button>
            {result && (
              <Button variant="outlined" fullWidth startIcon={<Download />} color="success" onClick={download}>
                Download Re-saved PDF
              </Button>
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
