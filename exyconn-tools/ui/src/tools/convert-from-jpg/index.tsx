import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Grid from '@mui/material/Grid2';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { MdPhotoLibrary } from 'react-icons/md';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import ResultsList from './ResultsList';
import {
  ACCEPTED_TYPES, MAX_FILES, ConvertItem, TargetFormat,
  convertFromJpg, downloadBlob, outputFileName,
} from './utils';

const COLOR = '#8b5cf6';

export default function ConvertFromJpg() {
  const [items, setItems] = useState<ConvertItem[]>([]);
  const [format, setFormat] = useState<TargetFormat>('image/png');
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const addFiles = useCallback((list: FileList) => {
    const accepted = Array.from(list).filter((f) => ACCEPTED_TYPES.has(f.type));
    if (accepted.length === 0) { setError('Please select JPG images.'); return; }
    setItems((prev) => {
      const next = [...prev, ...accepted.map((file) => ({ id: crypto.randomUUID(), file, status: 'pending' as const }))];
      if (next.length > MAX_FILES) setError(`Maximum ${MAX_FILES} files at a time.`);
      return next.slice(0, MAX_FILES);
    });
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const convertAll = async () => {
    setProcessing(true);
    const next = [...items];
    for (let i = 0; i < next.length; i++) {
      setProgress(i + 1);
      try {
        const blob = await convertFromJpg(next[i].file, format, quality / 100);
        next[i] = { ...next[i], status: 'done', blob, error: undefined };
      } catch (err) {
        next[i] = { ...next[i], status: 'error', blob: undefined, error: err instanceof Error ? err.message : 'Conversion failed.' };
      }
      setItems([...next]);
    }
    setProcessing(false);
  };

  const downloadItem = (item: ConvertItem) => {
    if (item.blob) downloadBlob(item.blob, outputFileName(item.file.name, format));
  };

  const downloadAll = async () => {
    for (const item of items) {
      if (item.status === 'done' && item.blob) {
        downloadBlob(item.blob, outputFileName(item.file.name, format));
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  };

  const doneCount = items.filter((i) => i.status === 'done').length;

  return (
    <ToolLayout toolName="Convert from JPG" toolIcon={<MdPhotoLibrary />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? COLOR : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop JPG Images Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                JPG or JPEG — up to {MAX_FILES} files
              </Typography>
              <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
                Browse Files<input hidden multiple accept="image/jpeg" type="file" onChange={onFileChange} />
              </Button>
            </Paper>

            {items.length > 0 && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>{items.length} file(s)</Typography>
                <ResultsList items={items} format={format} onDownload={downloadItem} />
                <Button size="small" onClick={() => setItems([])} sx={{ mt: 1 }}>Clear All</Button>
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Conversion Options</Typography>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Output Format</Typography>
              <ToggleButtonGroup
                exclusive size="small" value={format}
                onChange={(_, v) => v !== null && setFormat(v)}
                sx={{ mb: 2 }}
              >
                <ToggleButton value="image/png">PNG</ToggleButton>
                <ToggleButton value="image/webp">WEBP</ToggleButton>
              </ToggleButtonGroup>

              {format === 'image/webp' && (
                <>
                  <Typography variant="subtitle2" id="webp-quality-slider-label">WEBP Quality: {quality}%</Typography>
                  <Slider
                    value={quality} min={10} max={100} step={5}
                    onChange={(_, v) => setQuality(v as number)}
                    aria-labelledby="webp-quality-slider-label"
                    sx={{ color: COLOR, mb: 2 }}
                  />
                </>
              )}
              {format === 'image/png' && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  PNG is lossless — no quality setting needed.
                </Typography>
              )}

              {processing && (
                <>
                  <LinearProgress sx={{ my: 2 }} color="secondary" />
                  <Typography variant="caption" color="text.secondary">Converting {progress} of {items.length}…</Typography>
                </>
              )}

              <Button
                variant="contained" fullWidth onClick={convertAll} disabled={items.length === 0 || processing}
                sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#7c3aed' }, mt: 2 }}
              >
                {processing ? 'Converting…' : `Convert to ${format === 'image/webp' ? 'WEBP' : 'PNG'}`}
              </Button>

              {doneCount > 0 && (
                <Button variant="outlined" fullWidth startIcon={<Download />} onClick={downloadAll} sx={{ mt: 2, color: COLOR, borderColor: COLOR }}>
                  Download All ({doneCount})
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
