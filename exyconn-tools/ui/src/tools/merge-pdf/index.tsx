import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Grid from '@mui/material/Grid2';
import MergeType from '@mui/icons-material/MergeType';
import CloudUpload from '@mui/icons-material/CloudUpload';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Delete from '@mui/icons-material/Delete';
import Download from '@mui/icons-material/Download';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

interface PdfFile {
  file: File;
  name: string;
  size: number;
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

export default function MergePdf() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Uint8Array | null>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const pdfs = Array.from(incoming).filter((f) => f.type === 'application/pdf');
    if (!pdfs.length) { setError('Please select PDF files only.'); return; }
    setFiles((prev) => [...prev, ...pdfs.map((f) => ({ file: f, name: f.name, size: f.size }))]);
    setResult(null);
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }, [addFiles]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; };

  const move = (i: number, dir: -1 | 1) => {
    setFiles((prev) => { const a = [...prev]; [a[i], a[i + dir]] = [a[i + dir], a[i]]; return a; });
  };
  const remove = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const merge = async () => {
    if (files.length < 2) { setError('Add at least 2 PDFs to merge.'); return; }
    setProcessing(true);
    try {
      const merged = await PDFDocument.create();
      for (const f of files) {
        const bytes = await f.file.arrayBuffer();
        const src = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      setResult(await merged.save());
    } catch { setError('Failed to merge PDFs.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = 'merged.pdf'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="Merge PDF" toolIcon={<MergeType />} toolColor="#ef4444">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#ef4444' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#ef4444', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDFs Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" color="error">
                Browse Files
                <input hidden multiple accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>

            {files.length > 0 && (
              <Paper sx={{ mt: 2, maxHeight: 320, overflow: 'auto' }}>
                <List dense>
                  {files.map((f, i) => (
                    <ListItem key={`${f.name}-${i}`} secondaryAction={
                      <Box>
                        <IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpward fontSize="small" /></IconButton>
                        <IconButton size="small" disabled={i === files.length - 1} onClick={() => move(i, 1)}><ArrowDownward fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => remove(i)}><Delete fontSize="small" /></IconButton>
                      </Box>
                    }>
                      <ListItemText primary={f.name} secondary={formatSize(f.size)} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            <PdfPreview file={files.length > 0 ? files[0].file : null} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Merge Options</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {files.length} file(s) selected. Reorder files on the left, then click merge.
              </Typography>
              {processing && <LinearProgress sx={{ mb: 2 }} color="error" />}
              <Button variant="contained" fullWidth onClick={merge} disabled={processing || files.length < 2}
                sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, mb: 2 }}>
                {processing ? 'Merging…' : 'Merge PDFs'}
              </Button>
              {result && (
                <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download} color="error">
                  Download Merged PDF
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
