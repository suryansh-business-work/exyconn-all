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
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Grid from '@mui/material/Grid2';
import Tune from '@mui/icons-material/Tune';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Delete from '@mui/icons-material/Delete';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

interface PageInfo { index: number; width: number; height: number; }

const formatSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

export default function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Uint8Array | null>(null);

  const loadFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    setFile(f); setResult(null);
    try {
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const infos: PageInfo[] = [];
      for (let i = 0; i < doc.getPageCount(); i++) {
        const { width, height } = doc.getPage(i).getSize();
        infos.push({ index: i, width: Math.round(width), height: Math.round(height) });
      }
      setPdfBytes(bytes); setPages(infos);
    } catch { setError('Failed to read PDF.'); }
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  }, [loadFile]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = '';
  };

  const move = (i: number, dir: -1 | 1) => {
    const arr = [...pages]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setPages(arr); setResult(null);
  };

  const remove = (i: number) => { setPages((p) => p.filter((_, idx) => idx !== i)); setResult(null); };

  const organize = async () => {
    if (!pdfBytes || pages.length === 0) return;
    setProcessing(true);
    try {
      const srcDoc = await PDFDocument.load(pdfBytes);
      const newDoc = await PDFDocument.create();
      const indices = pages.map((p) => p.index);
      const copied = await newDoc.copyPages(srcDoc, indices);
      copied.forEach((p) => newDoc.addPage(p));
      setResult(await newDoc.save());
    } catch { setError('Failed to reorganize PDF.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url;
    a.download = `organized-${file?.name ?? 'document.pdf'}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="Organize PDF" toolIcon={<Tune />} toolColor="#3b82f6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#3b82f6' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#3b82f6', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" color="primary">
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
            {pages.length > 0 && (
              <Paper sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                <List dense>
                  {pages.map((p, i) => (
                    <ListItem key={`${p.index}-${i}`} secondaryAction={
                      <Box>
                        <IconButton size="small" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUpward fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => move(i, 1)} disabled={i === pages.length - 1}><ArrowDownward fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => remove(i)}><Delete fontSize="small" /></IconButton>
                      </Box>
                    }>
                      <ListItemText
                        primary={`Page ${i + 1} (original: ${p.index + 1})`}
                        secondary={`${p.width} x ${p.height} pts`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            {processing && <LinearProgress sx={{ mb: 2 }} />}
            <Button variant="contained" fullWidth sx={{ bgcolor: '#3b82f6', mb: 2, '&:hover': { bgcolor: '#2563eb' } }}
              onClick={organize} disabled={pages.length === 0 || processing}>
              {processing ? 'Processing...' : 'Reorganize PDF'}
            </Button>
            {result && (
              <Button variant="outlined" fullWidth startIcon={<Download />} color="primary" onClick={download}>
                Download Organized PDF
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
