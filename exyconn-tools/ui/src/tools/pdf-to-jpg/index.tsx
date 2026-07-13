import { useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid2';
import Image from '@mui/icons-material/Image';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import * as pdfjsLib from 'pdfjs-dist';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;

interface ConvertedImage { pageNum: number; url: string; blob: Blob }

export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(0.85);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    setImages([]);
    const buf = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    setPageCount(pdf.numPages);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const convert = useCallback(async () => {
    if (!file) return;
    setConverting(true);
    setImages([]);
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const results: ConvertedImage[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      setProgress(i);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), 'image/jpeg', quality)
      );
      results.push({ pageNum: i, url: URL.createObjectURL(blob), blob });
    }
    setImages(results);
    setConverting(false);
  }, [file, scale, quality]);

  const downloadOne = (img: ConvertedImage) => {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = `page-${img.pageNum}.jpg`;
    a.click();
  };

  const downloadAll = () => images.forEach((img, i) => setTimeout(() => downloadOne(img), i * 200));

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setFile(null);
    setPageCount(0);
    setImages([]);
    setProgress(0);
  };

  return (
    <ToolLayout toolName="PDF to JPG" toolIcon={<Image />} toolColor="#ec4899">
      <Grid container spacing={3}>
        {/* Upload */}
        <Grid size={12}>
          <Paper
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', cursor: 'pointer' }}
            onClick={() => {
              const i = document.createElement('input');
              i.type = 'file'; i.accept = '.pdf';
              i.onchange = () => { if (i.files?.[0]) handleFile(i.files[0]); };
              i.click();
            }}
          >
            <CloudUpload sx={{ fontSize: 48, color: '#ec4899', mb: 1 }} />
            <Typography>{file ? file.name : 'Drop a PDF here or click to upload'}</Typography>
            {pageCount > 0 && (
              <Typography variant="body2" color="text.secondary">{pageCount} page(s)</Typography>
            )}
          </Paper>
        </Grid>

        {/* Options */}
        {file && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography gutterBottom>Quality: {Math.round(quality * 100)}%</Typography>
              <Slider
                min={50} max={100} value={quality * 100}
                onChange={(_, v) => setQuality((v as number) / 100)}
                valueLabelDisplay="auto" sx={{ color: '#ec4899' }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Scale</InputLabel>
                <Select value={scale} label="Scale" onChange={(e) => setScale(Number(e.target.value))}>
                  <MenuItem value={1}>1x</MenuItem>
                  <MenuItem value={2}>2x</MenuItem>
                  <MenuItem value={3}>3x</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained" onClick={convert} disabled={converting}
                  sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}
                >
                  {converting ? `Converting page ${progress} of ${pageCount}...` : 'Convert to JPG'}
                </Button>
                <Button variant="outlined" onClick={reset}>Reset</Button>
              </Box>
              {converting && (
                <LinearProgress
                  variant="determinate" value={(progress / pageCount) * 100}
                  sx={{ mt: 2, '& .MuiLinearProgress-bar': { bgcolor: '#ec4899' } }}
                />
              )}
            </Grid>
          </>
        )}

        {/* Results */}
        {images.length > 0 && (
          <>
            <Grid size={12}>
              <Button
                variant="contained" startIcon={<Download />} onClick={downloadAll}
                sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}
              >
                Download All ({images.length})
              </Button>
            </Grid>
            {images.map((img) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={img.pageNum}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Box
                    component="img" src={img.url} alt={`Page ${img.pageNum}`}
                    sx={{ width: '100%', borderRadius: 1 }}
                  />
                  <Button
                    size="small" startIcon={<Download />}
                    onClick={() => downloadOne(img)} sx={{ mt: 1, color: '#ec4899' }}
                  >
                    Page {img.pageNum}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </>
        )}
      </Grid>
    </ToolLayout>
  );
}
