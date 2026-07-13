import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
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
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import TableChart from '@mui/icons-material/TableChart';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';

const formatSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

const ACCEPTED = '.xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

interface FileInfo { name: string; size: number; type: string; lastModified: string; extension: string; }

export default function ExcelToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState<FileInfo | null>(null);

  const loadFile = useCallback((f: File) => {
    const ext = f.name.toLowerCase();
    if (!ext.endsWith('.xls') && !ext.endsWith('.xlsx') && !ext.endsWith('.csv')) {
      setError('Please select an Excel or CSV file (.xls, .xlsx, or .csv).'); return;
    }
    const extension = ext.split('.').pop()?.toUpperCase() ?? 'Unknown';
    setInfo({ name: f.name, size: f.size, type: f.type || 'application/vnd.ms-excel', lastModified: new Date(f.lastModified).toLocaleDateString(), extension });
    setFile(f);
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; };

  const downloadFile = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
  };

  const tips = [
    { primary: 'Google Sheets', secondary: 'Upload to Google Sheets → File → Download → PDF Document (.pdf)' },
    { primary: 'Microsoft Excel', secondary: 'Open in Excel → File → Save As → Choose PDF format' },
    { primary: 'Print to PDF', secondary: 'Open the spreadsheet → Ctrl+P → Select "Microsoft Print to PDF"' },
    { primary: 'LibreOffice Calc (Free)', secondary: 'Open in LibreOffice Calc → File → Export as PDF' },
  ];

  return (
    <ToolLayout toolName="Excel to PDF" toolIcon={<TableChart />} toolColor="#14b8a6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#14b8a6' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#14b8a6', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop Excel File Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Supports .xls, .xlsx, and .csv files</Typography>
              <Button variant="outlined" component="label" sx={{ color: '#14b8a6', borderColor: '#14b8a6' }}>
                Browse Files <input hidden accept={ACCEPTED} type="file" onChange={onFileChange} />
              </Button>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {info && file ? (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="h6">File Details</Typography>
                  <Chip label="Coming Soon" color="success" size="small" variant="outlined" />
                </Box>
                <Table size="small">
                  <TableBody>
                    {([['File Name', info.name], ['File Size', formatSize(info.size)], ['Format', info.extension],
                      ['MIME Type', info.type], ['Last Modified', info.lastModified]] as [string, string][]).map(([l, v]) => (
                      <TableRow key={l}><TableCell sx={{ fontWeight: 600 }}>{l}</TableCell><TableCell>{v}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Alert severity="info" icon={<InfoOutlined />} sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Server-side conversion coming soon. In the meantime, here are quick alternatives:</Typography>
                  <List dense disablePadding>
                    {tips.map((t) => (
                      <ListItem key={t.primary} disableGutters sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}><CheckCircleOutline fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary={t.primary} secondary={t.secondary} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} secondaryTypographyProps={{ variant: 'caption' }} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
                <Button variant="contained" fullWidth startIcon={<Download />} onClick={downloadFile}
                  sx={{ mt: 2, bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' } }}>Download Original File</Button>
              </Paper>
            ) : (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <TableChart sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">Upload an Excel or CSV file to get started</Typography>
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
