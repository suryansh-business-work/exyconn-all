import { useState, useCallback, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid2';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { MdOutlineBrandingWatermark } from 'react-icons/md';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import WatermarkControls from './Controls';
import {
  WatermarkMode, TextWatermarkOptions, ImageWatermarkOptions,
  drawTextWatermark, drawImageWatermark, watermarkedFileName, loadImageFromFile,
} from './utils';

const COLOR = '#64748b';

export default function WatermarkImage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [watermarkImage, setWatermarkImage] = useState<HTMLImageElement | null>(null);
  const [watermarkName, setWatermarkName] = useState('');
  const [mode, setMode] = useState<WatermarkMode>('text');
  const [textOptions, setTextOptions] = useState<TextWatermarkOptions>({
    text: 'exyconn.com', fontSize: 48, color: '#ffffff', opacity: 0.5, position: 'bottom-right', tile: false,
  });
  const [imageOptions, setImageOptions] = useState<ImageWatermarkOptions>({ scale: 25, opacity: 0.5, position: 'bottom-right' });
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const loadFile = useCallback(async (f: File) => {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    try { setBaseImage(await loadImageFromFile(f)); setFile(f); }
    catch { setError('Could not load image.'); }
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const loadWatermarkFile = useCallback(async (f: File) => {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    try { setWatermarkImage(await loadImageFromFile(f)); setWatermarkName(f.name); }
    catch { setError('Could not load watermark image.'); }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;
    canvas.width = baseImage.naturalWidth;
    canvas.height = baseImage.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setError('Canvas is not supported in this browser.'); return; }
    ctx.drawImage(baseImage, 0, 0);
    if (mode === 'text' && textOptions.text.trim()) drawTextWatermark(ctx, canvas.width, canvas.height, textOptions);
    if (mode === 'image' && watermarkImage) drawImageWatermark(ctx, canvas.width, canvas.height, watermarkImage, imageOptions);
  }, [baseImage, watermarkImage, mode, textOptions, imageOptions]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || !file) return;
    canvas.toBlob((blob) => {
      if (!blob) { setError('Failed to export image.'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = watermarkedFileName(file.name); a.click(); URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const downloadDisabled = !baseImage || (mode === 'image' && !watermarkImage);

  return (
    <ToolLayout toolName="Watermark Image" toolIcon={<MdOutlineBrandingWatermark />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            {!baseImage && (
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
            {baseImage && (
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Box component="canvas" ref={canvasRef} aria-label="Watermarked image preview"
                  sx={{ maxWidth: '100%', maxHeight: 480, borderRadius: 1, border: 1, borderColor: 'divider' }} />
                <Button size="small" component="label" sx={{ display: 'block', mx: 'auto', mt: 1, color: COLOR }}>
                  Choose a different image
                  <input hidden accept="image/*" type="file" onChange={onFileChange} />
                </Button>
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Watermark Options</Typography>
              <Tabs value={mode} onChange={(_, v: WatermarkMode) => setMode(v)} sx={{ mb: 2 }}
                TabIndicatorProps={{ sx: { bgcolor: COLOR } }}>
                <Tab label="Text" value="text" sx={{ '&.Mui-selected': { color: COLOR } }} />
                <Tab label="Image" value="image" sx={{ '&.Mui-selected': { color: COLOR } }} />
              </Tabs>
              <WatermarkControls
                mode={mode}
                textOptions={textOptions} onTextChange={setTextOptions}
                imageOptions={imageOptions} onImageChange={setImageOptions}
                watermarkName={watermarkName} onWatermarkFile={loadWatermarkFile}
              />
              <Button variant="contained" fullWidth startIcon={<Download />} onClick={download} disabled={downloadDisabled}
                sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#475569' }, mt: 3 }}>
                Download Watermarked Image
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Your images are processed locally in your browser — they never leave your device.
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
