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
import RestartAlt from '@mui/icons-material/RestartAlt';
import { FiSliders } from 'react-icons/fi';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { Adjustments, ExportFormat, DEFAULT_ADJUSTMENTS, SLIDER_CONFIGS, buildFilter, isDefault, editedFileName, exportImage } from './utils';

const COLOR = '#ec4899';

export default function PhotoEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState('');
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const loadFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    setFile(f); setAdjustments(DEFAULT_ADJUSTMENTS);
    setImageSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f); });
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const setValue = (key: keyof Adjustments, value: number) => setAdjustments((prev) => ({ ...prev, [key]: value }));

  const exportAndDownload = async () => {
    if (!file || !imageSrc) { setError('Upload an image first.'); return; }
    setProcessing(true);
    try {
      const blob = await exportImage(imageSrc, adjustments, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = editedFileName(file.name, format); a.click(); URL.revokeObjectURL(url);
    } catch (err) { setError(err instanceof Error ? err.message : 'Export failed.'); } finally { setProcessing(false); }
  };

  return (
    <ToolLayout toolName="Photo Editor" toolIcon={<FiSliders />} toolColor={COLOR}>
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
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Box
                  component="img" src={imageSrc} alt={`Preview of ${file?.name ?? 'image'}`}
                  sx={{ maxWidth: '100%', maxHeight: 480, borderRadius: 1, filter: buildFilter(adjustments) }}
                />
                <Button size="small" component="label" sx={{ display: 'block', mx: 'auto', mt: 1, color: COLOR }}>
                  Choose a different image
                  <input hidden accept="image/*" type="file" onChange={onFileChange} />
                </Button>
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Adjustments</Typography>
                <Button size="small" startIcon={<RestartAlt />} onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                  disabled={isDefault(adjustments)} sx={{ color: COLOR }}>
                  Reset
                </Button>
              </Box>
              {SLIDER_CONFIGS.map((cfg) => (
                <Box key={cfg.key} sx={{ mb: 0.5 }}>
                  <Typography variant="caption">{cfg.label}: {adjustments[cfg.key]}{cfg.unit}</Typography>
                  <Slider
                    size="small" min={cfg.min} max={cfg.max} value={adjustments[cfg.key]} disabled={!imageSrc}
                    onChange={(_, v) => setValue(cfg.key, v as number)} sx={{ color: COLOR, py: 0.75 }}
                    aria-label={cfg.label}
                  />
                </Box>
              ))}

              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Export Format</Typography>
              <ToggleButtonGroup
                exclusive size="small" value={format}
                onChange={(_, v: ExportFormat | null) => { if (v !== null) setFormat(v); }} sx={{ mb: 2 }}
              >
                <ToggleButton value="png">PNG</ToggleButton>
                <ToggleButton value="jpeg">JPG</ToggleButton>
              </ToggleButtonGroup>

              {processing && <LinearProgress sx={{ my: 1 }} />}
              <Button variant="contained" fullWidth startIcon={<Download />} onClick={exportAndDownload} disabled={!imageSrc || processing}
                sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#db2777' } }}>
                {processing ? 'Exporting…' : `Download ${format === 'png' ? 'PNG' : 'JPG'}`}
              </Button>
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
