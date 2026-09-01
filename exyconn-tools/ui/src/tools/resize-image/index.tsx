import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Grid from '@mui/material/Grid2';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import Link from '@mui/icons-material/Link';
import LinkOff from '@mui/icons-material/LinkOff';
import { MdAspectRatio } from 'react-icons/md';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import {
  ACCEPTED_TYPES, PERCENT_PRESETS, SIZE_PRESETS, Dimensions, ResizeFormat,
  loadImage, resizeImage, scaleByPercent, lockedHeight, lockedWidth, outputFileName, downloadBlob,
} from './utils';

const COLOR = '#3b82f6';
const parseDim = (value: string): number => Math.max(1, Number.parseInt(value, 10) || 1);

export default function ResizeImage() {
  const [file, setFile] = useState<File | null>(null);
  const [original, setOriginal] = useState<Dimensions | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [locked, setLocked] = useState(true);
  const [format, setFormat] = useState<ResizeFormat>('image/png');
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ blob: Blob; dims: Dimensions } | null>(null);

  const loadFile = useCallback(async (f: File) => {
    if (!ACCEPTED_TYPES.has(f.type)) { setError('Please select a JPG, PNG, WEBP, or GIF image.'); return; }
    try {
      const img = await loadImage(f);
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      setFile(f); setOriginal(dims); setWidth(dims.width); setHeight(dims.height); setResult(null);
      setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(f); });
    } catch { setError('Could not read image.'); }
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const onWidthChange = (value: string) => {
    const w = parseDim(value);
    setWidth(w);
    if (locked && original) setHeight(lockedHeight(original, w));
  };

  const onHeightChange = (value: string) => {
    const h = parseDim(value);
    setHeight(h);
    if (locked && original) setWidth(lockedWidth(original, h));
  };

  const applyPercent = (percent: number) => {
    if (!original) return;
    const dims = scaleByPercent(original, percent);
    setWidth(dims.width); setHeight(dims.height);
  };

  const applyPreset = (w: number, h: number) => { setWidth(w); setHeight(h); };

  const resize = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const blob = await resizeImage(file, { width, height, format });
      setResult({ blob, dims: { width, height } });
    } catch (err) { setError(err instanceof Error ? err.message : 'Resize failed.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (result && file) downloadBlob(result.blob, outputFileName(file.name, format, result.dims));
  };

  return (
    <ToolLayout toolName="Resize Image" toolIcon={<MdAspectRatio />} toolColor={COLOR}>
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>JPG, PNG, WEBP, or GIF</Typography>
              <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
                Browse Files
                <input hidden accept="image/jpeg,image/png,image/webp,image/gif" type="file" onChange={onFileChange} />
              </Button>
            </Paper>

            {file && original && (
              <Paper sx={{ p: 2, mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}><strong>{file.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>Original: {original.width} × {original.height} px</Typography>
                <Box component="img" src={previewUrl} alt={`Preview of ${file.name}`} sx={{ maxWidth: '100%', maxHeight: 280, borderRadius: 1 }} />
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Resize Options</Typography>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <TextField size="small" type="number" label="Width (px)" value={width || ''} disabled={!original} onChange={(e) => onWidthChange(e.target.value)} />
                <Tooltip title={locked ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}>
                  <span>
                    <IconButton size="small" disabled={!original} onClick={() => setLocked((v) => !v)} aria-label="Toggle aspect ratio lock" sx={{ color: locked ? COLOR : 'text.secondary' }}>
                      {locked ? <Link /> : <LinkOff />}
                    </IconButton>
                  </span>
                </Tooltip>
                <TextField size="small" type="number" label="Height (px)" value={height || ''} disabled={!original} onChange={(e) => onHeightChange(e.target.value)} />
              </Stack>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Scale by Percent</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {PERCENT_PRESETS.map((p) => (
                  <Button key={p} size="small" variant="outlined" disabled={!original} onClick={() => applyPercent(p)}>{p}%</Button>
                ))}
              </Stack>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Common Sizes</Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
                {SIZE_PRESETS.map((preset) => (
                  <Chip key={preset.label} label={preset.label} size="small" disabled={!original} onClick={() => applyPreset(preset.width, preset.height)} />
                ))}
              </Stack>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Output Format</Typography>
              <ToggleButtonGroup exclusive size="small" value={format} onChange={(_, v) => v !== null && setFormat(v)} sx={{ mb: 2 }}>
                <ToggleButton value="image/png">PNG</ToggleButton>
                <ToggleButton value="image/jpeg">JPEG</ToggleButton>
                <ToggleButton value="image/webp">WEBP</ToggleButton>
              </ToggleButtonGroup>

              {processing && <LinearProgress sx={{ my: 2 }} />}
              <Button variant="contained" fullWidth onClick={resize} disabled={!file || processing} sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#2563eb' }, mt: 1 }}>
                {processing ? 'Resizing…' : 'Resize Image'}
              </Button>

              {result && (
                <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download} sx={{ mt: 2, color: COLOR, borderColor: COLOR }}>
                  Download ({result.dims.width} × {result.dims.height})
                </Button>
              )}

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
