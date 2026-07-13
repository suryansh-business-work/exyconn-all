import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Grid2';
import Compare from '@mui/icons-material/Compare';
import CloudUpload from '@mui/icons-material/CloudUpload';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const COLOR = '#14b8a6';
const fmt = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

interface PdfMeta { name: string; pages: number; size: string; title: string; author: string; creator: string; producer: string; dims: string[]; }

const extractMeta = async (f: File): Promise<PdfMeta> => {
  const bytes = await f.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  return {
    name: f.name, pages: doc.getPageCount(), size: fmt(f.size),
    title: doc.getTitle() ?? '—', author: doc.getAuthor() ?? '—',
    creator: doc.getCreator() ?? '—', producer: doc.getProducer() ?? '—',
    dims: pages.map((p) => { const s = p.getSize(); return `${s.width.toFixed(0)}×${s.height.toFixed(0)}`; }),
  };
};

const MatchIcon = ({ match }: { match: boolean }) => match ? <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} /> : <Cancel sx={{ color: 'error.main', fontSize: 20 }} />;

const UploadArea = ({ label, file, onFile, dragOver, setDragOver }: { label: string; file: File | null; onFile: (f: File) => void; dragOver: boolean; setDragOver: (v: boolean) => void }) => {
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value = ''; };
  return (
    <Paper sx={{ p: 3, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? COLOR : 'divider', transition: '0.2s' }}
      onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
      <CloudUpload sx={{ fontSize: 40, color: COLOR, mb: 1 }} />
      <Typography variant="subtitle1" gutterBottom>{label}</Typography>
      <Button variant="outlined" component="label" size="small" sx={{ color: COLOR, borderColor: COLOR }}>
        Browse<input hidden accept="application/pdf" type="file" onChange={onChange} />
      </Button>
      {file && <Typography variant="body2" sx={{ mt: 1 }}><strong>{file.name}</strong> ({fmt(file.size)})</Typography>}
    </Paper>
  );
};

export default function ComparePdf() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [drag1, setDrag1] = useState(false);
  const [drag2, setDrag2] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [meta1, setMeta1] = useState<PdfMeta | null>(null);
  const [meta2, setMeta2] = useState<PdfMeta | null>(null);

  const load1 = useCallback((f: File) => { if (f.type !== 'application/pdf') { setError('PDF only'); return; } setFile1(f); setMeta1(null); setMeta2(null); }, []);
  const load2 = useCallback((f: File) => { if (f.type !== 'application/pdf') { setError('PDF only'); return; } setFile2(f); setMeta1(null); setMeta2(null); }, []);

  const compare = async () => {
    if (!file1 || !file2) return;
    setProcessing(true);
    try {
      const [m1, m2] = await Promise.all([extractMeta(file1), extractMeta(file2)]);
      setMeta1(m1); setMeta2(m2);
    } catch { setError('Failed to load one or both PDFs.'); } finally { setProcessing(false); }
  };

  const rows: { prop: string; v1: string; v2: string }[] = meta1 && meta2 ? [
    { prop: 'Pages', v1: String(meta1.pages), v2: String(meta2.pages) },
    { prop: 'File Size', v1: meta1.size, v2: meta2.size },
    { prop: 'Title', v1: meta1.title, v2: meta2.title },
    { prop: 'Author', v1: meta1.author, v2: meta2.author },
    { prop: 'Creator', v1: meta1.creator, v2: meta2.creator },
    { prop: 'Producer', v1: meta1.producer, v2: meta2.producer },
    ...meta1.dims.map((d, i) => ({ prop: `Page ${i + 1} Size`, v1: d, v2: meta2.dims[i] ?? 'N/A' })),
    ...(meta2.dims.length > meta1.dims.length ? meta2.dims.slice(meta1.dims.length).map((d, i) => ({ prop: `Page ${meta1.dims.length + i + 1} Size`, v1: 'N/A', v2: d })) : []),
  ] : [];

  return (
    <ToolLayout toolName="Compare PDF" toolIcon={<Compare />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <UploadArea label="Upload PDF 1" file={file1} onFile={load1} dragOver={drag1} setDragOver={setDrag1} />
            {file1 && <PdfPreview file={file1} />}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <UploadArea label="Upload PDF 2" file={file2} onFile={load2} dragOver={drag2} setDragOver={setDrag2} />
            {file2 && <PdfPreview file={file2} />}
          </Grid>
          <Grid size={12}>
            {processing && <LinearProgress sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: COLOR } }} />}
            <Button variant="contained" fullWidth onClick={compare} disabled={!file1 || !file2 || processing} sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#0d9488' }, mb: 3 }}>
              {processing ? 'Comparing…' : 'Compare PDFs'}
            </Button>
            {rows.length > 0 && (
              <Paper sx={{ overflow: 'auto' }}>
                <Table size="small">
                  <TableHead><TableRow>
                    <TableCell><strong>Property</strong></TableCell><TableCell><strong>{meta1?.name}</strong></TableCell>
                    <TableCell><strong>{meta2?.name}</strong></TableCell><TableCell align="center"><strong>Match</strong></TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.prop} sx={{ bgcolor: r.v1 !== r.v2 ? 'error.main' : 'transparent', '& td': { color: r.v1 !== r.v2 ? 'error.contrastText' : 'inherit' } }}>
                        <TableCell>{r.prop}</TableCell><TableCell>{r.v1}</TableCell><TableCell>{r.v2}</TableCell>
                        <TableCell align="center"><MatchIcon match={r.v1 === r.v2} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}><Alert severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar>
    </ToolLayout>
  );
}
