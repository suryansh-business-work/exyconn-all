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
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Grid from '@mui/material/Grid2';
import TableChart from '@mui/icons-material/TableChart';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';

const formatSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

interface PdfMeta { pages: number; title: string; author: string; creator: string; producer: string; creationDate: string; }

export default function PdfToExcel() {
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
        pages: doc.getPageCount(), title: doc.getTitle() ?? 'N/A', author: doc.getAuthor() ?? 'N/A',
        creator: doc.getCreator() ?? 'N/A', producer: doc.getProducer() ?? 'N/A',
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

  const tips = [
    { primary: 'Adobe Acrobat', secondary: 'Open PDF → Export PDF → Spreadsheet → Microsoft Excel Workbook' },
    { primary: 'Google Sheets', secondary: 'Copy tabular data from PDF and paste into Google Sheets' },
    { primary: 'SmallPDF Online', secondary: 'Visit smallpdf.com/pdf-to-excel and upload your file' },
    { primary: 'Tabula (Free)', secondary: 'Use tabula.technology to extract tables from PDFs into CSV/Excel' },
  ];

  return (
    <ToolLayout toolName="PDF to Excel" toolIcon={<TableChart />} toolColor="#22c55e">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#22c55e' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#22c55e', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PDF Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
              <Button variant="outlined" component="label" sx={{ color: '#22c55e', borderColor: '#22c55e' }}>
                Browse Files <input hidden accept="application/pdf" type="file" onChange={onFileChange} />
              </Button>
            </Paper>
            {processing && <LinearProgress sx={{ mt: 2, '& .MuiLinearProgress-bar': { bgcolor: '#22c55e' } }} />}
            {file && (
              <Box sx={{ mt: 2 }}>
                <PdfPreview file={file} />
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {meta && file ? (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>PDF Metadata</Typography>
                <Table size="small">
                  <TableBody>
                    {([['File Name', file.name], ['File Size', formatSize(file.size)], ['Pages', String(meta.pages)],
                      ['Title', meta.title], ['Author', meta.author], ['Creator', meta.creator],
                      ['Producer', meta.producer], ['Created', meta.creationDate]] as [string, string][]).map(([l, v]) => (
                      <TableRow key={l}><TableCell sx={{ fontWeight: 600 }}>{l}</TableCell><TableCell>{v}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Alert severity="info" icon={<InfoOutlined />} sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Server-side conversion coming soon. Quick alternatives:</Typography>
                  <List dense disablePadding>
                    {tips.map((t) => (
                      <ListItem key={t.primary} disableGutters sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}><CheckCircleOutline fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary={t.primary} secondary={t.secondary} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} secondaryTypographyProps={{ variant: 'caption' }} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
                <Button variant="contained" fullWidth startIcon={<Download />} onClick={downloadPdf}
                  sx={{ mt: 2, bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' } }}>Download Original PDF</Button>
              </Paper>
            ) : (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <TableChart sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">Upload a PDF to view metadata</Typography>
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
