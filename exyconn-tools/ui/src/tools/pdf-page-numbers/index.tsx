import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid2';
import Numbers from '@mui/icons-material/Numbers';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

type Position = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
type Format = 'page-x' | 'x' | 'x-of-y';

const formatSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

const getCoords = (pos: Position, pw: number, ph: number, tw: number, _fs: number) => {
  const margin = 30;
  const yBottom = margin;
  const yTop = ph - margin;
  const xLeft = margin;
  const xCenter = (pw - tw) / 2;
  const xRight = pw - tw - margin;
  switch (pos) {
    case 'bottom-center': return { x: xCenter, y: yBottom };
    case 'bottom-left': return { x: xLeft, y: yBottom };
    case 'bottom-right': return { x: xRight, y: yBottom };
    case 'top-center': return { x: xCenter, y: yTop };
    case 'top-left': return { x: xLeft, y: yTop };
    case 'top-right': return { x: xRight, y: yTop };
    default: return { x: xCenter, y: yBottom };
  }
};

export default function PdfPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [fontSize, setFontSize] = useState(12);
  const [startNum, setStartNum] = useState(1);
  const [format, setFormat] = useState<Format>('x');

  const loadFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    setFile(f); setResult(null);
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  }, [loadFile]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = '';
  };

  const addNumbers = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const total = doc.getPageCount();
      for (let i = 0; i < total; i++) {
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const num = startNum + i;
        let text = `${num}`;
        if (format === 'page-x') text = `Page ${num}`;
        else if (format === 'x-of-y') text = `${num} of ${total + startNum - 1}`;
        const tw = font.widthOfTextAtSize(text, fontSize);
        const { x, y } = getCoords(position, width, height, tw, fontSize);
        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
      }
      setResult(await doc.save());
    } catch { setError('Failed to add page numbers.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url;
    a.download = `numbered-${file?.name ?? 'document.pdf'}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="PDF Page Numbers" toolIcon={<Numbers />} toolColor="#0ea5e9">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#0ea5e9' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#0ea5e9', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" color="info">
                Browse Files<input hidden accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {file && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="body2"><strong>{file.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Size: {formatSize(file.size)}</Typography>
              </Paper>
            )}
            {file && (
              <Box sx={{ mt: 2 }}>
                <PdfPreview file={file} />
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Position</InputLabel>
                <Select value={position} label="Position" onChange={(e) => setPosition(e.target.value as Position)}>
                  <MenuItem value="bottom-center">Bottom Center</MenuItem>
                  <MenuItem value="bottom-left">Bottom Left</MenuItem>
                  <MenuItem value="bottom-right">Bottom Right</MenuItem>
                  <MenuItem value="top-center">Top Center</MenuItem>
                  <MenuItem value="top-left">Top Left</MenuItem>
                  <MenuItem value="top-right">Top Right</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Format</InputLabel>
                <Select value={format} label="Format" onChange={(e) => setFormat(e.target.value as Format)}>
                  <MenuItem value="x">1, 2, 3...</MenuItem>
                  <MenuItem value="page-x">Page 1, Page 2...</MenuItem>
                  <MenuItem value="x-of-y">1 of N, 2 of N...</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Font Size" type="number" size="small" fullWidth
                value={fontSize} onChange={(e) => setFontSize(Math.max(6, +e.target.value))} />
              <TextField label="Start Number" type="number" size="small" fullWidth
                value={startNum} onChange={(e) => setStartNum(Math.max(1, +e.target.value))} />
            </Box>
            {processing && <LinearProgress sx={{ my: 2 }} color="info" />}
            <Button variant="contained" fullWidth sx={{ mt: 2, bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}
              onClick={addNumbers} disabled={!file || processing}>
              {processing ? 'Processing...' : 'Add Page Numbers'}
            </Button>
            {result && (
              <Button variant="outlined" fullWidth startIcon={<Download />} color="info" sx={{ mt: 2 }} onClick={download}>
                Download Numbered PDF
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
