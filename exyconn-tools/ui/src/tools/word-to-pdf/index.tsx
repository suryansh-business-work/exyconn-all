import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Grid2';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import { FaFileWord } from 'react-icons/fa';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import {
  ACCEPT_ATTR, NETWORK_ERROR_MESSAGE, SERVICE_UNAVAILABLE_MESSAGE,
  downloadBlob, formatSize, isAcceptedFile, pdfFileName, readErrorMessage,
} from './utils';

const COLOR = '#2563eb';
const HOVER = '#1d4ed8';

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const loadFile = useCallback((f: File) => {
    if (!isAcceptedFile(f.name)) { setFileError('Please select a Word document (.doc or .docx).'); return; }
    setFile(f); setPdfBlob(null); setConvertError('');
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }, [loadFile]);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) { loadFile(e.target.files[0]); }
    e.target.value = '';
  };

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setConvertError('');
    setPdfBlob(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(APIs.officeTools.officeToPdf, { method: 'POST', body: formData });
      if (res.status === 503) { setConvertError(SERVICE_UNAVAILABLE_MESSAGE); return; }
      if (!res.ok) { setConvertError(await readErrorMessage(res)); return; }
      setPdfBlob(await res.blob());
    } catch {
      setConvertError(NETWORK_ERROR_MESSAGE);
    } finally {
      setConverting(false);
    }
  };

  const outputName = file ? pdfFileName(file.name) : '';
  const actionButton = pdfBlob ? (
    <Button variant="contained" fullWidth startIcon={<Download />} onClick={() => downloadBlob(pdfBlob, outputName)}
      sx={{ mt: 2, bgcolor: COLOR, '&:hover': { bgcolor: HOVER } }}>
      Download {outputName}
    </Button>
  ) : (
    <Button variant="contained" fullWidth onClick={convert} disabled={converting}
      sx={{ mt: 2, bgcolor: COLOR, '&:hover': { bgcolor: HOVER } }}>
      {converting ? 'Converting…' : 'Convert to PDF'}
    </Button>
  );

  return (
    <ToolLayout toolName="Word to PDF" toolIcon={<FaFileWord />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: dragOver ? COLOR : 'divider', cursor: 'pointer', transition: '0.2s' }}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            >
              <CloudUpload sx={{ fontSize: 48, color: COLOR, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Drag & Drop Word File Here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Supports .doc and .docx files</Typography>
              <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
                Browse Files <input hidden accept={ACCEPT_ATTR} type="file" onChange={onFileChange} />
              </Button>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {file ? (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>File Details</Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>File Name</TableCell><TableCell>{file.name}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>File Size</TableCell><TableCell>{formatSize(file.size)}</TableCell></TableRow>
                  </TableBody>
                </Table>
                {converting && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress sx={{ mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">Converting on Exyconn server…</Typography>
                  </Box>
                )}
                {convertError && <Alert severity="error" sx={{ mt: 2 }}>{convertError}</Alert>}
                {pdfBlob && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Conversion complete — {outputName} ({formatSize(pdfBlob.size)}) is ready to download.
                  </Alert>
                )}
                {actionButton}
              </Paper>
            ) : (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <Box sx={{ fontSize: 64, color: 'text.disabled', mb: 2, display: 'flex' }}><FaFileWord /></Box>
                  <Typography color="text.secondary">Upload a Word document to get started</Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
        <Snackbar open={!!fileError} autoHideDuration={4000} onClose={() => setFileError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setFileError('')}>{fileError}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}
