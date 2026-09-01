import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Download from '@mui/icons-material/Download';
import { TOOL_COLOR, TOOL_COLOR_DARK, type PreviewRow } from './utils';

interface ExtractionResultsProps {
  totalRows: number;
  pageCount: number;
  preview: PreviewRow[];
  onDownload: () => void;
}

const ExtractionResults = ({ totalRows, pageCount, preview, onDownload }: Readonly<ExtractionResultsProps>) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>
      Extracted {totalRows} rows across {pageCount} page{pageCount === 1 ? '' : 's'}. Preview of the first{' '}
      {preview.length} rows of page 1:
    </Typography>
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableBody>
          {preview.map((row) => (
            <TableRow key={row.id}>
              {row.cells.map((cell) => (
                <TableCell key={cell.id} sx={{ whiteSpace: 'nowrap' }}>
                  {cell.text}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
    <Button
      variant="contained"
      startIcon={<Download />}
      onClick={onDownload}
      sx={{ mt: 2, bgcolor: TOOL_COLOR, '&:hover': { bgcolor: TOOL_COLOR_DARK } }}
    >
      Download XLSX
    </Button>
  </Paper>
);

export default ExtractionResults;
