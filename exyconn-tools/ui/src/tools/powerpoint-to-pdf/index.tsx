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
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';

const formatSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`);

const ACCEPTED = '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';

interface FileInfo { name: string; size: number; type: string; lastModified: string; }

export default function PowerpointToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState<FileInfo | null>(null);

  const loadFile = useCallback((f: File) => {
    const ext = f.name.toLowerCase();
    if (!ext.endsWith('.ppt') && !ext.endsWith('.pptx')) { setError('Please select a PowerPoint file (.ppt or .pptx).'); return; }
    setInfo({ name: f.name, size: f.size, type: f.type || 'application/vnd.ms-powerpoint', lastModified: new Date(f.lastModified).toLocaleDateString() });
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
    { primary: 'Google Slides', secondary: 'Upload to Google Slides → File → Download → PDF Document (.pdf)' },
    { primary: 'Microsoft PowerPoint', secondary: 'Open in PowerPoint → File → Save As → Choose PDF format' },
    { primary: 'Print to PDF', secondary: 'Open the presentation → Ctrl+P → Select "Microsoft Print to PDF"' },
    { primary: 'LibreOffice Impress (Free)', secondary: 'Open in LibreOffice Impress → File → Export as PDF' },
  ];

  return (
    <ToolLayout toolName="PowerPoint to PDF" toolIcon={<PictureAsPdf />} toolColor="#8b5cf6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? '#8b5cf6' : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: '#8b5cf6', mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop PowerPoint File Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Supports .ppt and .pptx files</Typography>
              <Button variant="outlined" component="label" sx={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}>
                Browse Files <input hidden accept={ACCEPTED} type="file" onChange={onFileChange} />
              </Button>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {info && file ? (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="h6">File Details</Typography>
                  <Chip label="Coming Soon" color="secondary" size="small" variant="outlined" />
                </Box>
                <Table size="small">
                  <TableBody>
                    {([['File Name', info.name], ['File Size', formatSize(info.size)],
                      ['File Type', info.type], ['Last Modified', info.lastModified]] as [string, string][]).map(([l, v]) => (
                      <TableRow key={l}><TableCell sx={{ fontWeight: 600 }}>{l}</TableCell><TableCell>{v}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Alert severity="info" icon={<InfoOutlined />} sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Server-side conversion coming soon. In the meantime, here are quick alternatives:</Typography>
                  <List dense disablePadding>
                    {tips.map((t) => (
                      <ListItem key={t.primary} disableGutters sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}><CheckCircleOutline fontSize="small" color="secondary" /></ListItemIcon>
                        <ListItemText primary={t.primary} secondary={t.secondary} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} secondaryTypographyProps={{ variant: 'caption' }} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
                <Button variant="contained" fullWidth startIcon={<Download />} onClick={downloadFile}
                  sx={{ mt: 2, bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>Download Original File</Button>
              </Paper>
            ) : (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <PictureAsPdf sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">Upload a PowerPoint file to get started</Typography>
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
