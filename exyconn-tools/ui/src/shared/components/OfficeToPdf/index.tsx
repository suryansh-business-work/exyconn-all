import { useState, useCallback } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import ToolLayout from '../ToolLayout/ToolLayout';
import { APIs } from '../../config/apis';
import DropZone from './DropZone';
import FilePanel from './FilePanel';
import type { OfficeToPdfConfig } from './types';
import { NETWORK_ERROR_MESSAGE, SERVICE_UNAVAILABLE_MESSAGE, readErrorMessage } from './utils';

export type { OfficeToPdfConfig } from './types';

/** An office document converted to PDF on the server: the page every "<format> to PDF" tool is. */
export default function OfficeToPdf(config: Readonly<OfficeToPdfConfig>) {
  const { toolName, icon, color, isAcceptedFile, invalidFileMessage, emptyHint } = config;
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const loadFile = useCallback(
    (f: File) => {
      if (!isAcceptedFile(f.name)) {
        setFileError(invalidFileMessage);
        return;
      }
      setFile(f);
      setPdfBlob(null);
      setConvertError('');
    },
    [isAcceptedFile, invalidFileMessage]
  );

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setConvertError('');
    setPdfBlob(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(APIs.officeTools.officeToPdf, { method: 'POST', body: formData });
      if (res.status === 503) {
        setConvertError(SERVICE_UNAVAILABLE_MESSAGE);
        return;
      }
      if (!res.ok) {
        setConvertError(await readErrorMessage(res));
        return;
      }
      setPdfBlob(await res.blob());
    } catch {
      setConvertError(NETWORK_ERROR_MESSAGE);
    } finally {
      setConverting(false);
    }
  };

  return (
    <ToolLayout toolName={toolName} toolIcon={icon} toolColor={color}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <DropZone
              color={color}
              accept={config.accept}
              dropTitle={config.dropTitle}
              supportedFormats={config.supportedFormats}
              onFile={loadFile}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {file ? (
              <FilePanel
                color={color}
                hoverColor={config.hoverColor}
                file={file}
                converting={converting}
                convertError={convertError}
                pdfBlob={pdfBlob}
                onConvert={convert}
              />
            ) : (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <Box sx={{ fontSize: 64, color: 'text.disabled', mb: 2, display: 'flex' }}>{icon}</Box>
                  <Typography
                    sx={{
                      color: 'text.secondary',
                    }}
                  >
                    {emptyHint}
                  </Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
        <Snackbar
          open={!!fileError}
          autoHideDuration={4000}
          onClose={() => setFileError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setFileError('')}>
            {fileError}
          </Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}
