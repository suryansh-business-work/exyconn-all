import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Compress from '@mui/icons-material/Compress';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const formatSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const loadFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    setFile(f); setOriginalSize(f.size); setResult(null); setCompressedSize(0);
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const compress = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const saved = await doc.save();
      setResult(saved);
      setCompressedSize(saved.length);
    } catch { setError('Failed to compress PDF.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `compressed-${file?.name ?? 'document.pdf'}`; a.click(); URL.revokeObjectURL(url);
  };

  const reduction = originalSize > 0 && compressedSize > 0
    ? (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)
    : null;

  return (
    <ToolLayout toolName="Compress PDF" toolIcon={<Compress />} toolColor="#10b981">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#10b981' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" color="success">
                Browse Files
                <input hidden accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {file && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="body2"><strong>{file.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Original size: {formatSize(originalSize)}</Typography>
              </Paper>
            )}

            <PdfPreview file={file} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Compression</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                This tool performs basic compression by re-serializing the PDF, which strips unused objects and may reduce file size. For advanced compression, consider dedicated tools.
              </Alert>
              {processing && <LinearProgress sx={{ mb: 2 }} color="success" />}
              <Button variant="contained" fullWidth onClick={compress} disabled={!file || processing}
                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, mb: 2 }}>
                {processing ? 'Compressing…' : 'Compress PDF'}
              </Button>

              {result && (
                <Box>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">Original</Typography>
                        <Typography variant="body1" fontWeight={600}>{formatSize(originalSize)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">Compressed</Typography>
                        <Typography variant="body1" fontWeight={600}>{formatSize(compressedSize)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">Reduction</Typography>
                        <Typography variant="body1" fontWeight={600} color={Number(reduction) > 0 ? 'success.main' : 'warning.main'}>
                          {reduction}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                  <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download} color="success">
                    Download Compressed PDF
                  </Button>
                </Box>
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
