import { useState, useCallback, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid2';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { MdAddPhotoAlternate } from 'react-icons/md';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import {
  ACCEPTED_TYPES, canvasToPngBlob, downloadBlob, drawMeme, loadImage, memeFileName,
} from './utils';

const COLOR = '#f97316';

export default function MemeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [uppercase, setUppercase] = useState(true);
  const [topPadding, setTopPadding] = useState(4);
  const [bottomPadding, setBottomPadding] = useState(4);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const loadFile = useCallback(async (f: File) => {
    if (!ACCEPTED_TYPES.has(f.type)) { setError('Please select a JPG, PNG, WEBP, GIF, or BMP image.'); return; }
    try { setImg(await loadImage(f)); setFile(f); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not read image.'); }
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  }, [loadFile]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
    e.target.value = '';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    try {
      drawMeme(canvas, img, { topText, bottomText, uppercase, topPadding, bottomPadding });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not render the meme.');
    }
  }, [img, topText, bottomText, uppercase, topPadding, bottomPadding]);

  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    try {
      downloadBlob(await canvasToPngBlob(canvas), memeFileName(file?.name ?? 'image.png'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export the meme.');
    }
  };

  return (
    <ToolLayout toolName="Meme Generator" toolIcon={<MdAddPhotoAlternate />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? COLOR : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop an Image Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                JPG, PNG, WEBP, GIF, or BMP
              </Typography>
              <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
                Browse Files<input hidden accept="image/jpeg,image/png,image/webp,image/gif,image/bmp" type="file" onChange={onFileChange} />
              </Button>
            </Paper>

            {img && (
              <Paper sx={{ p: 2, mt: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>Preview</Typography>
                <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }} />
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Captions</Typography>

              <TextField
                fullWidth size="small" label="Top text" value={topText}
                onChange={(e) => setTopText(e.target.value)} sx={{ mb: 2 }}
              />
              <TextField
                fullWidth size="small" label="Bottom text" value={bottomText}
                onChange={(e) => setBottomText(e.target.value)} sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={<Switch checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />}
                label="UPPERCASE"
                sx={{ mb: 1 }}
              />

              <Typography variant="subtitle2" id="top-padding-slider-label">Top padding: {topPadding}%</Typography>
              <Slider
                value={topPadding} min={0} max={30} step={1}
                onChange={(_, v) => setTopPadding(v as number)}
                aria-labelledby="top-padding-slider-label"
                sx={{ color: COLOR, mb: 1 }}
              />
              <Typography variant="subtitle2" id="bottom-padding-slider-label">Bottom padding: {bottomPadding}%</Typography>
              <Slider
                value={bottomPadding} min={0} max={30} step={1}
                onChange={(_, v) => setBottomPadding(v as number)}
                aria-labelledby="bottom-padding-slider-label"
                sx={{ color: COLOR, mb: 1 }}
              />

              <Button
                variant="contained" fullWidth startIcon={<Download />} onClick={download} disabled={!img}
                sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#ea580c' }, mt: 1 }}
              >
                Download PNG
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
