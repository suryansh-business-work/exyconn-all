import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid2';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import RestartAlt from '@mui/icons-material/RestartAlt';
import * as pdfjsLib from 'pdfjs-dist';
import PptxGenJS from 'pptxgenjs';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';
import { fitContain, SLIDE_16X9 } from './utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;

const COLOR = '#f59e0b';
const RENDER_SCALE = 2;

const renderPageToDataUrl = async (
  page: pdfjsLib.PDFPageProxy
): Promise<{ dataUrl: string; width: number; height: number }> => {
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvas, viewport }).promise;
  return { dataUrl: canvas.toDataURL('image/png'), width: viewport.width, height: viewport.height };
};

export default function PdfToPowerpoint() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }
    setFile(f);
    setDone(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    e.target.value = '';
  };

  const convert = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setDone(false);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress({ current: i, total: pdf.numPages });
        const page = await pdf.getPage(i);
        const { dataUrl, width, height } = await renderPageToDataUrl(page);
        const box = fitContain(width, height, SLIDE_16X9.w, SLIDE_16X9.h);
        pptx.addSlide().addImage({ data: dataUrl, ...box });
      }
      await pptx.writeFile({ fileName: `${file.name.replace(/\.pdf$/i, '')}.pptx` });
      setDone(true);
    } catch {
      setError('Failed to convert PDF. The file may be corrupted or password-protected.');
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const reset = useCallback(() => {
    setFile(null);
    setProgress({ current: 0, total: 0 });
    setDone(false);
  }, []);

  return (
    <ToolLayout toolName="PDF to PowerPoint" toolIcon={<PictureAsPdf />} toolColor={COLOR}>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Paper
              onDrop={onDrop}
              onDragOver={(e: DragEvent) => e.preventDefault()}
              onClick={() => !processing && document.getElementById('pdf-to-powerpoint-upload')?.click()}
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: file ? COLOR : 'divider',
                cursor: 'pointer',
              }}
            >
              <input
                id="pdf-to-powerpoint-upload"
                type="file"
                accept="application/pdf"
                hidden
                onChange={onFileChange}
              />
              <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
              <Typography variant="h6">{file ? file.name : 'Drop PDF here or click to upload'}</Typography>
              {file && (
                <Typography variant="body2" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB
                </Typography>
              )}
            </Paper>
            {file && <PdfPreview file={file} />}
          </Grid>

          <Grid size={12}>
            <Alert severity="info">
              Conversion runs entirely in your browser: each PDF page is rendered as a high-resolution image and placed
              on its own 16:9 slide. Slide contents are images, so text is not editable in PowerPoint.
            </Alert>
          </Grid>

          <Grid size={12} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={convert}
              disabled={!file || processing}
              sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#d97706' } }}
            >
              Convert & Download PPTX
            </Button>
            <Button variant="outlined" startIcon={<RestartAlt />} onClick={reset} disabled={processing}>
              Reset
            </Button>
          </Grid>

          {processing && (
            <Grid size={12}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Rendering page {progress.current} of {progress.total}...
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress.total ? (progress.current / progress.total) * 100 : 0}
                sx={{ '& .MuiLinearProgress-bar': { bgcolor: COLOR } }}
              />
            </Grid>
          )}

          {done && (
            <Grid size={12}>
              <Alert severity="success">PowerPoint presentation downloaded.</Alert>
            </Grid>
          )}
        </Grid>
      </Container>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </ToolLayout>
  );
}
