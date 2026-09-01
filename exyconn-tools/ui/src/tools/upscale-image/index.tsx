import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Grid from '@mui/material/Grid2';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { MdFilterHdr } from 'react-icons/md';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { ACCEPTED_TYPES, UpscaleScale, formatBytes, outputFileName, upscaleImage } from './utils';

const COLOR = '#6366f1';

type ResultView = 'original' | 'upscaled';

export default function UpscaleImage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [scale, setScale] = useState<UpscaleScale>(2);
  const [resultScale, setResultScale] = useState<UpscaleScale>(2);
  const [view, setView] = useState<ResultView>('original');
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const loadFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.has(f.type)) { setError('Please select a JPG, PNG, or WEBP image.'); return; }
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(f); setOriginalUrl(URL.createObjectURL(f)); setResultUrl(''); setView('original');
  }, [originalUrl, resultUrl]);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const upscale = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const blob = await upscaleImage(file, scale);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultScale(scale);
      setView('upscaled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upscaling failed.');
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl; a.download = outputFileName(file.name, resultScale); a.click();
  };

  const showUpscaled = view === 'upscaled' && !!resultUrl;
  const previewUrl = showUpscaled ? resultUrl : originalUrl;
  const previewLabel = showUpscaled ? `Upscaled ${resultScale}x` : 'Original';

  return (
    <ToolLayout toolName="Upscale Image" toolIcon={<MdFilterHdr />} toolColor={COLOR}>
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

            {originalUrl && (
              <Paper sx={{ p: 2, mt: 2, textAlign: 'center' }}>
                {resultUrl && (
                  <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v !== null && setView(v)} sx={{ mb: 2 }}>
                    <ToggleButton value="original">Original</ToggleButton>
                    <ToggleButton value="upscaled">Upscaled</ToggleButton>
                  </ToggleButtonGroup>
                )}
                <Box component="img" src={previewUrl} alt={previewLabel} sx={{ maxWidth: '100%', maxHeight: 420, borderRadius: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>{previewLabel}</Typography>
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Upscale Options</Typography>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Scale Factor</Typography>
              <ToggleButtonGroup exclusive value={scale} onChange={(_, v) => v !== null && setScale(v)} disabled={processing} sx={{ mb: 1 }}>
                <ToggleButton value={2}>2x</ToggleButton>
                <ToggleButton value={4}>4x</ToggleButton>
              </ToggleButtonGroup>

              {processing && <LinearProgress sx={{ my: 2 }} />}
              <Button
                variant="contained" fullWidth onClick={upscale} disabled={!file || processing}
                sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#4f46e5' }, mt: 2 }}
              >
                {processing ? 'Upscaling…' : 'Upscale Image'}
              </Button>
              {resultUrl && (
                <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download} sx={{ mt: 2, color: COLOR, borderColor: COLOR }}>
                  Download Upscaled Image
                </Button>
              )}

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                Your image is uploaded securely to the Exyconn server for AI upscaling and is never stored or shared.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}
