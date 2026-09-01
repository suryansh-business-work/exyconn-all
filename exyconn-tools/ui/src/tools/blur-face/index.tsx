import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Grid from '@mui/material/Grid2';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import Undo from '@mui/icons-material/Undo';
import { MdBlurOn } from 'react-icons/md';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import BlurCanvas from './BlurCanvas';
import RegionList from './RegionList';
import {
  ACCEPTED_TYPES, BlurMode, Rect, Region,
  downloadCanvas, loadImage, outputFileName, renderRedacted,
} from './utils';

const COLOR = '#f59e0b';

export default function BlurFace() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [mode, setMode] = useState<BlurMode>('pixelate');
  const [intensity, setIntensity] = useState(16);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const loadFile = useCallback(async (f: File) => {
    if (!ACCEPTED_TYPES.has(f.type)) { setError('Please select a JPG, PNG, or WEBP image.'); return; }
    try {
      const img = await loadImage(f);
      setImage(img);
      setFileName(f.name);
      setRegions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the image.');
    }
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  }, [loadFile]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
    e.target.value = '';
  };

  const addRegion = useCallback((rect: Rect) => {
    setRegions((prev) => [...prev, { ...rect, id: crypto.randomUUID() }]);
  }, []);

  const removeRegion = (id: string) => setRegions((prev) => prev.filter((r) => r.id !== id));

  const download = async () => {
    if (!image) return;
    try {
      const canvas = document.createElement('canvas');
      renderRedacted(canvas, image, regions, mode, intensity);
      await downloadCanvas(canvas, outputFileName(fileName));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    }
  };

  return (
    <ToolLayout toolName="Blur Face" toolIcon={<MdBlurOn />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? COLOR : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop Image Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>JPG, PNG, or WEBP</Typography>
              <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
                Browse Files
                <input hidden accept="image/jpeg,image/png,image/webp" type="file" onChange={onFileChange} />
              </Button>
            </Paper>

            {image && (
              <>
                <BlurCanvas
                  image={image} regions={regions} mode={mode} intensity={intensity}
                  color={COLOR} onAddRegion={addRegion} onError={setError}
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Drag on the image (mouse or touch) to draw a rectangle over each face or area you want to hide.
                </Typography>
              </>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Blur Options</Typography>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Effect</Typography>
              <ToggleButtonGroup exclusive size="small" value={mode} onChange={(_, v) => v !== null && setMode(v)} sx={{ mb: 2 }}>
                <ToggleButton value="pixelate">Pixelate</ToggleButton>
                <ToggleButton value="blur">Box Blur</ToggleButton>
              </ToggleButtonGroup>

              <Typography variant="subtitle2" id="intensity-slider-label">Intensity: {intensity}</Typography>
              <Slider
                value={intensity} min={4} max={48} step={2}
                onChange={(_, v) => setIntensity(v as number)}
                aria-labelledby="intensity-slider-label"
                sx={{ color: COLOR, mb: 2 }}
              />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Regions ({regions.length})</Typography>
              <RegionList regions={regions} onRemove={removeRegion} />
              {regions.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button size="small" startIcon={<Undo />} onClick={() => setRegions((prev) => prev.slice(0, -1))}>
                    Undo Last
                  </Button>
                  <Button size="small" color="error" onClick={() => setRegions([])}>Clear All</Button>
                </Stack>
              )}
              {regions.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  No regions yet — upload an image and drag on the preview to add one.
                </Typography>
              )}

              <Button
                variant="contained" fullWidth startIcon={<Download />} onClick={download}
                disabled={!image || regions.length === 0}
                sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#d97706' }, mt: 3 }}
              >
                Download Blurred Image
              </Button>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                Regions are selected manually — this tool does not auto-detect faces. Images are
                processed locally in your browser and never leave your device.
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
