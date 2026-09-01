import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Grid from '@mui/material/Grid2';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { FiCrop } from 'react-icons/fi';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { ASPECT_PRESETS, cropFileName, getCroppedBlob, outputMime } from './utils';

const COLOR = '#f59e0b';

export default function CropImage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState('');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectLabel, setAspectLabel] = useState('Free');
  const [mediaAspect, setMediaAspect] = useState(4 / 3);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [resultUrl, setResultUrl] = useState('');

  const loadFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    setFile(f); setAreaPixels(null); setCrop({ x: 0, y: 0 }); setZoom(1);
    setResultUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return ''; });
    setImageSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f); });
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const aspect = ASPECT_PRESETS.find((p) => p.label === aspectLabel)?.value ?? mediaAspect;

  const cropImage = async () => {
    if (!file || !imageSrc || !areaPixels) { setError('Upload an image and adjust the crop area first.'); return; }
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, areaPixels, outputMime(file.type));
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
    } catch (err) { setError(err instanceof Error ? err.message : 'Crop failed.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement('a'); a.href = resultUrl; a.download = cropFileName(file.name, outputMime(file.type)); a.click();
  };

  return (
    <ToolLayout toolName="Crop Image" toolIcon={<FiCrop />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            {!imageSrc && (
              <Paper
                sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? COLOR : 'divider', cursor: 'pointer', transition: '0.2s' }}
                onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)} onDrop={onDrop}
              >
                <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
                <Typography variant="h6" gutterBottom>Drag & Drop Image Here</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
                <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
                  Browse Files
                  <input hidden accept="image/*" type="file" onChange={onFileChange} />
                </Button>
              </Paper>
            )}
            {imageSrc && (
              <Paper sx={{ p: 1 }}>
                <Box sx={{ position: 'relative', width: '100%', height: { xs: 300, md: 420 }, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                  <Cropper
                    image={imageSrc} crop={crop} zoom={zoom} aspect={aspect}
                    onCropChange={setCrop} onZoomChange={setZoom}
                    onCropComplete={(_, px) => setAreaPixels(px)}
                    onMediaLoaded={(size) => setMediaAspect(size.naturalWidth / size.naturalHeight)}
                  />
                </Box>
                <Button size="small" component="label" sx={{ mt: 1, color: COLOR }}>
                  Choose a different image
                  <input hidden accept="image/*" type="file" onChange={onFileChange} />
                </Button>
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Crop Options</Typography>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Aspect Ratio</Typography>
              <ToggleButtonGroup
                exclusive size="small" value={aspectLabel}
                onChange={(_, v: string | null) => { if (v !== null) setAspectLabel(v); }}
                sx={{ mb: 2, flexWrap: 'wrap' }}
              >
                {ASPECT_PRESETS.map((p) => <ToggleButton key={p.label} value={p.label}>{p.label}</ToggleButton>)}
              </ToggleButtonGroup>

              <Typography variant="subtitle2">Zoom: {zoom.toFixed(1)}x</Typography>
              <Slider min={1} max={5} step={0.1} value={zoom} disabled={!imageSrc} onChange={(_, v) => setZoom(v as number)} sx={{ color: COLOR, mb: 1 }} />
              {areaPixels && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Selection: {areaPixels.width} × {areaPixels.height}px
                </Typography>
              )}

              {processing && <LinearProgress sx={{ my: 2 }} color="warning" />}
              <Button variant="contained" fullWidth onClick={cropImage} disabled={!imageSrc || processing}
                sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#d97706' }, mt: 1 }}>
                {processing ? 'Cropping…' : 'Crop Image'}
              </Button>
              {resultUrl && (
                <>
                  <Box component="img" src={resultUrl} alt="Cropped result preview" sx={{ mt: 2, maxWidth: '100%', borderRadius: 1, border: 1, borderColor: 'divider' }} />
                  <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download} sx={{ mt: 2, color: COLOR, borderColor: COLOR }}>
                    Download Cropped Image
                  </Button>
                </>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Your image is processed locally in your browser — it never leaves your device.
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
