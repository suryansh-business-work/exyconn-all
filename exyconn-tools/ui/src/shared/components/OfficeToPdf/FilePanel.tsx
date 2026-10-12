import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Download from '@mui/icons-material/Download';
import type { OfficeToPdfConfig } from './types';
import { downloadBlob, formatSize, pdfFileName } from './utils';

type FilePanelProps = Pick<OfficeToPdfConfig, 'color' | 'hoverColor'> & {
  file: File;
  converting: boolean;
  convertError: string;
  pdfBlob: Blob | null;
  onConvert: () => void;
};

export default function FilePanel({
  color,
  hoverColor,
  file,
  converting,
  convertError,
  pdfBlob,
  onConvert,
}: Readonly<FilePanelProps>) {
  const outputName = pdfFileName(file.name);
  const buttonSx = { mt: 2, bgcolor: color, '&:hover': { bgcolor: hoverColor } };
  const actionButton = pdfBlob ? (
    <Button
      variant="contained"
      fullWidth
      startIcon={<Download />}
      onClick={() => downloadBlob(pdfBlob, outputName)}
      sx={buttonSx}
    >
      Download {outputName}
    </Button>
  ) : (
    <Button variant="contained" fullWidth onClick={onConvert} disabled={converting} sx={buttonSx}>
      {converting ? 'Converting…' : 'Convert to PDF'}
    </Button>
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        File Details
      </Typography>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>File Name</TableCell>
            <TableCell>{file.name}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>File Size</TableCell>
            <TableCell>{formatSize(file.size)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {converting && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress sx={{ mb: 1 }} />
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
            }}
          >
            Converting on Exyconn server…
          </Typography>
        </Box>
      )}
      {convertError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {convertError}
        </Alert>
      )}
      {pdfBlob && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Conversion complete — {outputName} ({formatSize(pdfBlob.size)}) is ready to download.
        </Alert>
      )}
      {actionButton}
    </Paper>
  );
}
