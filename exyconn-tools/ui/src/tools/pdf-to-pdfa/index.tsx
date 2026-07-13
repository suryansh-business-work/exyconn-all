import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Grid2';
import Security from '@mui/icons-material/Security';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const COLOR = '#8b5cf6';
const fmt = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

interface Meta { pages: number; size: string; title: string; author: string; producer: string; creator: string; }

export default function PdfToPdfa() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [before, setBefore] = useState<Meta | null>(null);
  const [after, setAfter] = useState<Meta | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const loadFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    try {
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setBefore({ pages: doc.getPageCount(), size: fmt(f.size), title: doc.getTitle() ?? '—', author: doc.getAuthor() ?? '—', producer: doc.getProducer() ?? '—', creator: doc.getCreator() ?? '—' });
      setFile(f); setResult(null); setAfter(null);
    } catch { setError('Failed to read PDF.'); }
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const convert = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      doc.setTitle(doc.getTitle() ?? file.name.replace('.pdf', ''));
      doc.setAuthor(doc.getAuthor() ?? 'Unknown');
      doc.setCreator('Exyconn PDF/A Tool');
      doc.setProducer('pdf-lib');
      const saved = await doc.save();
      const newDoc = await PDFDocument.load(saved);
      setAfter({ pages: newDoc.getPageCount(), size: fmt(saved.length), title: newDoc.getTitle() ?? '—', author: newDoc.getAuthor() ?? '—', producer: newDoc.getProducer() ?? '—', creator: newDoc.getCreator() ?? '—' });
      setResult(saved);
    } catch { setError('Failed to process PDF.'); } finally { setProcessing(false); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `pdfa-${file?.name ?? 'document.pdf'}`; a.click(); URL.revokeObjectURL(url);
  };

  const metaRows = (label: string, b?: string, a?: string) => (
    <TableRow><TableCell>{label}</TableCell><TableCell>{b ?? '—'}</TableCell><TableCell>{a ?? '—'}</TableCell></TableRow>
  );

  return (
    <ToolLayout toolName="PDF to PDF/A" toolIcon={<Security />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? COLOR : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
              <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
                Browse Files<input hidden accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {file && before && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="body2"><strong>{file.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">{before.size} · {before.pages} page(s)</Typography>
              </Paper>
            )}
            {file && (
              <Box sx={{ mt: 2 }}>
                <PdfPreview file={file} />
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>PDF/A Conversion</Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                PDF/A conversion (ISO 19005) requires specialized tools. This tool re-saves the PDF with embedded metadata as a basic step toward compliance.
              </Alert>
              {processing && <LinearProgress sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: COLOR } }} />}
              <Button variant="contained" fullWidth onClick={convert} disabled={!file || processing} sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#7c3aed' }, mb: 2 }}>
                {processing ? 'Processing…' : 'Convert to PDF/A'}
              </Button>
              {result && (
                <Box>
                  <Button variant="outlined" fullWidth startIcon={<Download />} onClick={download} sx={{ color: COLOR, borderColor: COLOR, mb: 2 }}>Download PDF/A</Button>
                  <Table size="small">
                    <TableBody>
                      <TableRow><TableCell><strong>Property</strong></TableCell><TableCell><strong>Before</strong></TableCell><TableCell><strong>After</strong></TableCell></TableRow>
                      {metaRows('Title', before?.title, after?.title)}
                      {metaRows('Author', before?.author, after?.author)}
                      {metaRows('Creator', before?.creator, after?.creator)}
                      {metaRows('Producer', before?.producer, after?.producer)}
                      {metaRows('Pages', String(before?.pages), String(after?.pages))}
                      {metaRows('Size', before?.size, after?.size)}
                    </TableBody>
                  </Table>
                </Box>
              )}
              <Alert severity="info" sx={{ mt: 2 }}>For full PDF/A compliance, use Adobe Acrobat Pro or veraPDF for validation.</Alert>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}><Alert severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar>
    </ToolLayout>
  );
}
