import { useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid2';
import DocumentScanner from '@mui/icons-material/DocumentScanner';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Download from '@mui/icons-material/Download';
import RestartAlt from '@mui/icons-material/RestartAlt';
import CloudUpload from '@mui/icons-material/CloudUpload';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;

const COLOR = '#6366f1';

const LANGUAGES = [
  { value: 'eng', label: 'English' },
  { value: 'hin', label: 'Hindi' },
  { value: 'spa', label: 'Spanish' },
  { value: 'fra', label: 'French' },
  { value: 'deu', label: 'German' },
  { value: 'chi_sim', label: 'Chinese' },
];

export default function OcrPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [extractedText, setExtractedText] = useState('');
  const [language, setLanguage] = useState('eng');
  const [copied, setCopied] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    setExtractedText('');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const extractText = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setExtractedText('');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress({ current: i, total: pdf.numPages });
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const { data: { text } } = await Tesseract.recognize(canvas, language);
        fullText += `--- Page ${i} ---\n${text}\n\n`;
      }
      setExtractedText(fullText);
    } catch {
      setExtractedText('Error: Failed to process PDF.');
    } finally {
      setProcessing(false);
    }
  }, [file, language]);

  const copyText = useCallback(() => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [extractedText]);

  const downloadTxt = useCallback(() => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${file?.name.replace('.pdf', '') || 'ocr'}-extracted.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [extractedText, file]);

  const reset = useCallback(() => {
    setFile(null);
    setProcessing(false);
    setProgress({ current: 0, total: 0 });
    setExtractedText('');
    setCopied(false);
  }, []);

  return (
    <ToolLayout toolName="OCR PDF" toolIcon={<DocumentScanner />} toolColor={COLOR}>
      <Grid container spacing={3}>
        {/* Upload */}
        <Grid size={12}>
          <Paper
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: file ? COLOR : 'divider', cursor: 'pointer' }}
            onClick={() => !processing && document.getElementById('ocr-upload')?.click()}
          >
            <input id="ocr-upload" type="file" accept=".pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
            <Typography variant="h6">{file ? file.name : 'Drop PDF here or click to upload'}</Typography>
            {file && <Typography variant="body2" color="text.secondary">{(file.size / 1024).toFixed(1)} KB</Typography>}
          </Paper>
          {file && <PdfPreview file={file} />}
        </Grid>

        {/* Language & Actions */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select fullWidth label="OCR Language" value={language} onChange={(e) => setLanguage(e.target.value)} disabled={processing}>
            {LANGUAGES.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={extractText} disabled={!file || processing} sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#4f46e5' } }}>
            Extract Text
          </Button>
          <Button variant="outlined" startIcon={<RestartAlt />} onClick={reset} disabled={processing}>Reset</Button>
        </Grid>

        {/* Progress */}
        {processing && (
          <Grid size={12}>
            <Typography variant="body2" sx={{ mb: 1 }}>Processing page {progress.current} of {progress.total}...</Typography>
            <LinearProgress variant="determinate" value={progress.total ? (progress.current / progress.total) * 100 : 0} sx={{ '& .MuiLinearProgress-bar': { bgcolor: COLOR } }} />
          </Grid>
        )}

        {/* Result */}
        {extractedText && (
          <Grid size={12}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button variant="outlined" startIcon={<ContentCopy />} onClick={copyText}>{copied ? 'Copied!' : 'Copy Text'}</Button>
              <Button variant="outlined" startIcon={<Download />} onClick={downloadTxt}>Download as TXT</Button>
            </Box>
            <Paper sx={{ p: 2, maxHeight: 500, overflow: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 14 }}>
              {extractedText}
            </Paper>
          </Grid>
        )}
      </Grid>
    </ToolLayout>
  );
}
