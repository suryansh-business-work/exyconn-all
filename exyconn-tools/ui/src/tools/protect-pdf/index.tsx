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
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';
import { APIs } from '../../shared/config/apis';
import {
  formatSize, validateUserPassword, protectedFileName, requestProtectedPdf,
  downloadBlob, SERVICE_UNAVAILABLE,
} from './utils';

export default function ProtectPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serviceDown, setServiceDown] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);

  const loadFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    setFile(f); setResult(null); setServiceDown(false);
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  }, [loadFile]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) { loadFile(e.target.files[0]); }
    e.target.value = '';
  };

  const protect = async () => {
    if (!file) return;
    const validation = validateUserPassword(userPassword);
    setPasswordError(validation);
    if (validation) return;
    setProcessing(true); setServiceDown(false); setResult(null);
    try {
      const blob = await requestProtectedPdf(APIs.pdfTools.protect, file, userPassword, ownerPassword);
      setResult(blob);
    } catch (err) {
      if (err instanceof Error && err.message === SERVICE_UNAVAILABLE) {
        setServiceDown(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to protect the PDF.');
      }
    } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result || !file) return;
    downloadBlob(result, protectedFileName(file.name));
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
                required error={!!passwordError} helperText={passwordError || 'Minimum 4 characters.'}
                value={userPassword}
                onChange={(e) => { setUserPassword(e.target.value); setPasswordError(''); }} />
              <TextField label="Owner Password (to edit, optional)" type="password" fullWidth size="small"
                value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Alert severity="info" icon={<Info />} sx={{ mb: 2 }}>
              Your PDF is encrypted on our server with <strong>AES-256</strong> and the passwords you set.
              Files are processed transiently and never stored.
            </Alert>
            {serviceDown && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                The PDF protection service is temporarily unavailable. Please try again in a few minutes.
              </Alert>
            )}
            {processing && <LinearProgress sx={{ mb: 2 }} color="success" />}
            <Button variant="contained" fullWidth sx={{ bgcolor: '#22c55e', mb: 2, '&:hover': { bgcolor: '#16a34a' } }}
              onClick={protect} disabled={!file || processing}>
              {processing ? 'Encrypting...' : 'Protect PDF'}
            </Button>
            {result && (
              <Button variant="outlined" fullWidth startIcon={<Download />} color="success" onClick={download}>
                Download Protected PDF
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
