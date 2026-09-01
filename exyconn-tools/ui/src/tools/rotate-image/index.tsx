import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import Grid from '@mui/material/Grid2';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import RotateLeft from '@mui/icons-material/RotateLeft';
import RotateRight from '@mui/icons-material/RotateRight';
import Flip from '@mui/icons-material/Flip';
import RestartAlt from '@mui/icons-material/RestartAlt';
import { MdRotateRight } from 'react-icons/md';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import {
  ACCEPTED_TYPES, INITIAL_TRANSFORM, TransformState,
  rotateBy, cssTransform, isIdentity, applyTransform, outputFileName, downloadBlob,
} from './utils';

const COLOR = '#14b8a6';

export default function RotateImage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [transform, setTransform] = useState<TransformState>(INITIAL_TRANSFORM);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const loadFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.has(f.type)) { setError('Please select a JPG, PNG, WEBP, or GIF image.'); return; }
    setFile(f);
    setTransform(INITIAL_TRANSFORM);
    setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(f); });
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const rotate = (delta: number) => setTransform((t) => ({ ...t, rotation: rotateBy(t.rotation, delta) }));
  const toggleFlipH = () => setTransform((t) => ({ ...t, flipH: !t.flipH }));
  const toggleFlipV = () => setTransform((t) => ({ ...t, flipV: !t.flipV }));

  const download = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const blob = await applyTransform(file, transform);
      downloadBlob(blob, outputFileName(file.name, file.type));
    } catch (err) { setError(err instanceof Error ? err.message : 'Rotation failed.'); } finally { setProcessing(false); }
  };

  return (
    <ToolLayout toolName="Rotate Image" toolIcon={<MdRotateRight />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            {!file && (
              <Paper
                sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? COLOR : 'divider', cursor: 'pointer', transition: '0.2s' }}
                onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)} onDrop={onDrop}
              >
                <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
                <Typography variant="h6" gutterBottom>Drag & Drop Image Here</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>JPG, PNG, WEBP, or GIF</Typography>
                <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
                  Browse Files
                  <input hidden accept="image/jpeg,image/png,image/webp,image/gif" type="file" onChange={onFileChange} />
                </Button>
              </Paper>
            )}

            {file && (
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" gutterBottom sx={{ wordBreak: 'break-all' }}><strong>{file.name}</strong></Typography>
                <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Box
                    component="img" src={previewUrl} alt={`Preview of ${file.name}`}
                    sx={{ maxWidth: '65%', maxHeight: '65%', transform: cssTransform(transform), transition: 'transform 0.25s' }}
                  />
                </Box>
                <Button size="small" component="label" sx={{ mt: 1 }}>
                  Choose Another Image
                  <input hidden accept="image/jpeg,image/png,image/webp,image/gif" type="file" onChange={onFileChange} />
                </Button>
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Rotate & Flip</Typography>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Rotate</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button variant="outlined" size="small" startIcon={<RotateLeft />} disabled={!file} onClick={() => rotate(270)}>Rotate Left</Button>
                <Button variant="outlined" size="small" startIcon={<RotateRight />} disabled={!file} onClick={() => rotate(90)}>Rotate Right</Button>
                <Button variant="outlined" size="small" disabled={!file} onClick={() => rotate(180)}>180°</Button>
              </Stack>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Flip</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <ToggleButton value="flipH" size="small" selected={transform.flipH} disabled={!file} onChange={toggleFlipH}>
                  <Flip fontSize="small" sx={{ mr: 0.5 }} /> Horizontal
                </ToggleButton>
                <ToggleButton value="flipV" size="small" selected={transform.flipV} disabled={!file} onChange={toggleFlipV}>
                  <Flip fontSize="small" sx={{ mr: 0.5, transform: 'rotate(90deg)' }} /> Vertical
                </ToggleButton>
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
                <Chip size="small" label={`Rotation: ${transform.rotation}°`} />
                {transform.flipH && <Chip size="small" label="Flipped horizontally" />}
                {transform.flipV && <Chip size="small" label="Flipped vertically" />}
              </Stack>

              <Button variant="text" size="small" startIcon={<RestartAlt />} disabled={!file || isIdentity(transform)} onClick={() => setTransform(INITIAL_TRANSFORM)} sx={{ mb: 1 }}>
                Reset
              </Button>

              {processing && <LinearProgress sx={{ my: 2 }} />}
              <Button
                variant="contained" fullWidth startIcon={<Download />} onClick={download} disabled={!file || processing}
                sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#0d9488' } }}
              >
                {processing ? 'Processing…' : 'Download Rotated Image'}
              </Button>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                Images are processed locally in your browser — they never leave your device.
              </Typography>
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
