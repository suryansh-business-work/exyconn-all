import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid2';
import InsertPhoto from '@mui/icons-material/InsertPhoto';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Delete from '@mui/icons-material/Delete';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';

type PageSize = 'a4' | 'letter' | 'fit';
interface ImageItem { file: File; preview: string; }

const ACCEPT = 'image/jpeg,image/png,image/webp';
const A4 = { w: 595.28, h: 841.89 };
const LETTER = { w: 612, h: 792 };

export default function JpgToPdf() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>('a4');

  const addFiles = useCallback((files: FileList) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) { setError('Please select image files (JPG, PNG, WebP).'); return; }
    const items: ImageItem[] = valid.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...items]); setResult(null);
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files); e.target.value = '';
  };

  const move = (i: number, dir: -1 | 1) => {
    const arr = [...images]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setImages(arr); setResult(null);
  };

  const remove = (i: number) => {
    setImages((prev) => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i); });
    setResult(null);
  };

  const convert = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    try {
      const doc = await PDFDocument.create();
      for (const img of images) {
        const bytes = new Uint8Array(await img.file.arrayBuffer());
        let embedded;
        if (img.file.type === 'image/png') {
          embedded = await doc.embedPng(bytes);
        } else {
          embedded = await doc.embedJpg(bytes);
        }
        const dims = embedded.scale(1);
        let pw: number, ph: number, dx: number, dy: number, dw: number, dh: number;
        if (pageSize === 'fit') {
          pw = dims.width; ph = dims.height; dx = 0; dy = 0; dw = dims.width; dh = dims.height;
        } else {
          const ref = pageSize === 'a4' ? A4 : LETTER;
          pw = ref.w; ph = ref.h;
          const scale = Math.min(pw / dims.width, ph / dims.height);
          dw = dims.width * scale; dh = dims.height * scale;
          dx = (pw - dw) / 2; dy = (ph - dh) / 2;
        }
        const page = doc.addPage([pw, ph]);
        page.drawImage(embedded, { x: dx, y: dy, width: dw, height: dh });
      }
      setResult(await doc.save());
    } catch { setError('Failed to convert images to PDF.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = 'images.pdf'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="JPG to PDF" toolIcon={<InsertPhoto />} toolColor="#06b6d4">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#06b6d4' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#06b6d4', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop Images Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>JPG, PNG, or WebP</Typography>
              <Button variant="outlined" component="label" color="info">
                Browse Files<input hidden accept={ACCEPT} type="file" multiple onChange={onFileChange} />
              </Button>
            </Paper>
            <FormControl size="small" fullWidth sx={{ mt: 2 }}>
              <InputLabel>Page Size</InputLabel>
              <Select value={pageSize} label="Page Size" onChange={(e) => { setPageSize(e.target.value as PageSize); setResult(null); }}>
                <MenuItem value="a4">A4 (595 x 842)</MenuItem>
                <MenuItem value="letter">Letter (612 x 792)</MenuItem>
                <MenuItem value="fit">Fit to Image</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {images.length > 0 && (
              <Paper sx={{ maxHeight: 360, overflow: 'auto', mb: 2, p: 1 }}>
                {images.map((img, i) => (
                  <Box key={img.preview} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
                    <Box component="img" src={img.preview} alt={img.file.name}
                      sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }} />
                    <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {img.file.name}
                    </Typography>
                    <IconButton size="small" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUpward fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => move(i, 1)} disabled={i === images.length - 1}><ArrowDownward fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => remove(i)}><Delete fontSize="small" /></IconButton>
                  </Box>
                ))}
              </Paper>
            )}
            {processing && <LinearProgress sx={{ mb: 2 }} color="info" />}
            <Button variant="contained" fullWidth sx={{ bgcolor: '#06b6d4', mb: 2, '&:hover': { bgcolor: '#0891b2' } }}
              onClick={convert} disabled={images.length === 0 || processing}>
              {processing ? 'Converting...' : `Convert ${images.length} Image${images.length !== 1 ? 's' : ''} to PDF`}
            </Button>
            {result && (
              <Button variant="outlined" fullWidth startIcon={<Download />} color="info" onClick={download}>
                Download PDF
              </Button>
            )}
          </Grid>
        </Grid>
        <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}
