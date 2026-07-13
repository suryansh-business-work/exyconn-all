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
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Description from '@mui/icons-material/Description';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const formatSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

interface PdfMeta { pages: number; title: string; author: string; creator: string; producer: string; creationDate: string; }

export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState<PdfMeta | null>(null);

  const loadFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please select a PDF file.'); return; }
    setProcessing(true);
    try {
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const created = doc.getCreationDate();
      setMeta({
        pages: doc.getPageCount(),
        title: doc.getTitle() ?? 'N/A',
        author: doc.getAuthor() ?? 'N/A',
        creator: doc.getCreator() ?? 'N/A',
        producer: doc.getProducer() ?? 'N/A',
        creationDate: created ? created.toLocaleDateString() : 'N/A',
      });
      setFile(f);
    } catch { setError('Failed to read PDF.'); } finally { setProcessing(false); }
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const downloadPdf = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolName="PDF to Word" toolIcon={<Description />} toolColor="#3b82f6">
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
              <Button variant="outlined" component="label" sx={{ color: '#3b82f6', borderColor: '#3b82f6' }}>
                Browse Files
                <input hidden accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {processing && <LinearProgress sx={{ mt: 2 }} />}
            {file && (
              <Box sx={{ mt: 2 }}>
                <PdfPreview file={file} />
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {meta && file ? (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="h6">PDF Metadata</Typography>
                  <Chip label="Coming Soon" color="warning" size="small" variant="outlined" />
                </Box>
                <Table size="small">
                  <TableBody>
                    {([
                      ['File Name', file.name],
                      ['File Size', formatSize(file.size)],
                      ['Pages', String(meta.pages)],
                      ['Title', meta.title],
                      ['Author', meta.author],
                      ['Creator', meta.creator],
                      ['Producer', meta.producer],
                      ['Created', meta.creationDate],
                    ] as [string, string][]).map(([label, value]) => (
                      <TableRow key={label}>
                        <TableCell sx={{ fontWeight: 600 }}>{label}</TableCell>
                        <TableCell>{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Alert severity="info" icon={<InfoOutlined />} sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Full PDF-to-Word conversion</strong> requires server-side processing and is coming soon.
                  </Typography>
                  <Typography variant="body2">
                    In the meantime, you can: upload the PDF to <strong>Google Docs</strong> and download as DOCX, or open it in <strong>Microsoft Word Online</strong> for automatic conversion.
                  </Typography>
                </Alert>

                <Button variant="contained" fullWidth startIcon={<Download />} onClick={downloadPdf}
                  sx={{ mt: 2, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
                  Download Original PDF
                </Button>
              </Paper>
            ) : (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <Description sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">Upload a PDF to extract metadata</Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>

        <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}
