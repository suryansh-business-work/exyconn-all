import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Grid from '@mui/material/Grid2';
import WaterDrop from '@mui/icons-material/WaterDrop';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const formatSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

function hexToRgb(hex: string) {
  const v = parseInt(hex.replace('#', ''), 16);
  return { r: ((v >> 16) & 255) / 255, g: ((v >> 8) & 255) / 255, b: (v & 255) / 255 };
}

export default function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(0.3);
  const [color, setColor] = useState('#888888');
  const [rotation, setRotation] = useState(45);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Uint8Array | null>(null);

  const loadFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    setFile(f); setResult(null);
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const apply = async () => {
    if (!file || !text.trim()) { setError('Upload a PDF and enter watermark text.'); return; }
    setProcessing(true);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const { r, g, b: blue } = hexToRgb(color);
      const pages = doc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);
        page.drawText(text, {
          x: width / 2 - textWidth / 2,
          y: height / 2 - textHeight / 2,
          size: fontSize,
          font,
          color: rgb(r, g, blue),
          opacity,
          rotate: degrees(rotation),
        });
      }
      setResult(await doc.save());
    } catch { setError('Failed to add watermark.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `watermarked-${file?.name ?? 'document.pdf'}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="Watermark PDF" toolIcon={<WaterDrop />} toolColor="#64748b">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#64748b' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#64748b', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" sx={{ color: '#64748b', borderColor: '#64748b' }}>
                Browse Files
                <input hidden accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {file && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="body2"><strong>{file.name}</strong> — {formatSize(file.size)}</Typography>
              </Paper>
            )}

            <PdfPreview file={file} />
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Watermark Options</Typography>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField fullWidth size="small" label="Watermark Text" value={text} onChange={(e) => setText(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption">Font Size: {fontSize}px</Typography>
                  <Slider min={20} max={100} value={fontSize} onChange={(_, v) => setFontSize(v as number)} sx={{ color: '#64748b' }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption">Opacity: {opacity.toFixed(1)}</Typography>
                  <Slider min={0.1} max={1} step={0.05} value={opacity} onChange={(_, v) => setOpacity(v as number)} sx={{ color: '#64748b' }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption">Rotation: {rotation}°</Typography>
                  <Slider min={-180} max={180} value={rotation} onChange={(_, v) => setRotation(v as number)} sx={{ color: '#64748b' }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Color</Typography>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '100%', height: 36, border: 'none', cursor: 'pointer' }} />
                </Grid>
              </Grid>

              {processing && <LinearProgress sx={{ my: 2 }} />}
              <Button variant="contained" fullWidth onClick={apply} disabled={!file || processing}
                sx={{ bgcolor: '#64748b', '&:hover': { bgcolor: '#475569' }, mt: 2 }}>
                {processing ? 'Applying…' : 'Apply Watermark'}
              </Button>
              {result && (
                <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download}
                  sx={{ mt: 2, color: '#64748b', borderColor: '#64748b' }}>
                  Download Watermarked PDF
                </Button>
              )}
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
