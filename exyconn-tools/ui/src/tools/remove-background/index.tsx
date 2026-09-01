import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid2';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { MdBrokenImage } from 'react-icons/md';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { ACCEPTED_TYPES, fileToDataUrl, formatBytes, outputFileName, removeBackground } from './utils';

const COLOR = '#0ea5e9';

const CHECKERBOARD = {
  backgroundImage:
    'linear-gradient(45deg, rgba(128,128,128,0.3) 25%, transparent 25%), linear-gradient(-45deg, rgba(128,128,128,0.3) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.3) 75%), linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.3) 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
} as const;

export default function RemoveBackground() {
  const [file, setFile] = useState<File | null>(null);
  const [original, setOriginal] = useState('');
  const [result, setResult] = useState('');
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const loadFile = useCallback(async (f: File) => {
    if (!ACCEPTED_TYPES.has(f.type)) { setError('Please select a JPG, PNG, or WEBP image.'); return; }
    try {
      const dataUrl = await fileToDataUrl(f);
      setFile(f); setOriginal(dataUrl); setResult('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the image.');
    }
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const removeBg = async () => {
    if (!original) return;
    setProcessing(true);
    try {
      setResult(await removeBackground(original));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Background removal failed.');
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    const a = document.createElement('a');
    a.href = result; a.download = outputFileName(file.name); a.click();
  };

  return (
    <ToolLayout toolName="Remove Background" toolIcon={<MdBrokenImage />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? COLOR : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop Image Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>JPG, PNG, or WEBP — one image</Typography>
              <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
                Browse Files
                <input hidden accept="image/jpeg,image/png,image/webp" type="file" onChange={onFileChange} />
              </Button>
            </Paper>

            {file && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="body2"><strong>{file.name}</strong> — {formatBytes(file.size)}</Typography>
              </Paper>
            )}

            {original && (
              <Paper sx={{ p: 2, mt: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>Original</Typography>
                <Box component="img" src={original} alt="Original" sx={{ maxWidth: '100%', maxHeight: 360, borderRadius: 1 }} />
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Remove Background</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                AI detects the subject and erases the background, leaving a transparent PNG.
              </Typography>

              {processing && <LinearProgress sx={{ my: 2 }} />}
              <Button
                variant="contained" fullWidth onClick={removeBg} disabled={!original || processing}
                sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#0284c7' }, mt: 1 }}
              >
                {processing ? 'Removing Background…' : 'Remove Background'}
              </Button>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                Processing happens on the Exyconn server — your image is uploaded for background removal and is never stored or shared.
              </Typography>
            </Paper>

            {result && (
              <Paper sx={{ p: 2, mt: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>Result — transparent background</Typography>
                <Box sx={{ ...CHECKERBOARD, display: 'inline-block', borderRadius: 1, p: 1 }}>
                  <Box component="img" src={result} alt="Image with background removed" sx={{ maxWidth: '100%', maxHeight: 360, display: 'block' }} />
                </Box>
                <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download} sx={{ mt: 2, color: COLOR, borderColor: COLOR }}>
                  Download PNG
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>

        <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}
