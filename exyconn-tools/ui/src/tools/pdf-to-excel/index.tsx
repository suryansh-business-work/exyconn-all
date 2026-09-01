import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid2';
import TableChart from '@mui/icons-material/TableChart';
import CloudUpload from '@mui/icons-material/CloudUpload';
import RestartAlt from '@mui/icons-material/RestartAlt';
import * as pdfjsLib from 'pdfjs-dist';
import { Workbook } from 'exceljs';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { PdfPreview } from '../../shared/components/PdfPreview';
import ExtractionResults from './ExtractionResults';
import { downloadBlob, extractRows, toPreviewRows, TOOL_COLOR, TOOL_COLOR_DARK, type PreviewRow } from './utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;

const PREVIEW_ROW_LIMIT = 8;
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const buildWorkbookBuffer = async (pages: string[][][]): Promise<ArrayBuffer> => {
  const workbook = new Workbook();
  pages.forEach((rows, index) => {
    const sheet = workbook.addWorksheet(`Page ${index + 1}`);
    for (const row of rows) {
      sheet.addRow(row);
    }
  });
  return workbook.xlsx.writeBuffer();
};

export default function PdfToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [pages, setPages] = useState<string[][][] | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }
    setFile(f);
    setPages(null);
    setPreview([]);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    e.target.value = '';
  };

  const extract = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setPages(null);
    setPreview([]);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const result: string[][][] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress({ current: i, total: pdf.numPages });
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        result.push(extractRows(content.items));
      }
      setPages(result);
      setPreview(toPreviewRows(result[0] ?? [], PREVIEW_ROW_LIMIT));
    } catch {
      setError('Failed to read PDF. The file may be corrupted or password-protected.');
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const download = useCallback(async () => {
    if (!pages || !file) return;
    try {
      const buffer = await buildWorkbookBuffer(pages);
      downloadBlob(new Blob([buffer], { type: XLSX_MIME }), `${file.name.replace(/\.pdf$/i, '')}.xlsx`);
    } catch {
      setError('Failed to generate the Excel file.');
    }
  }, [pages, file]);

  const reset = useCallback(() => {
    setFile(null);
    setProgress({ current: 0, total: 0 });
    setPages(null);
    setPreview([]);
  }, []);

  const totalRows = pages ? pages.reduce((sum, rows) => sum + rows.length, 0) : 0;

  return (
    <ToolLayout toolName="PDF to Excel" toolIcon={<TableChart />} toolColor={TOOL_COLOR}>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Paper
              onDrop={onDrop}
              onDragOver={(e: DragEvent) => e.preventDefault()}
              onClick={() => !processing && document.getElementById('pdf-to-excel-upload')?.click()}
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: file ? TOOL_COLOR : 'divider',
                cursor: 'pointer',
              }}
            >
              <input id="pdf-to-excel-upload" type="file" accept="application/pdf" hidden onChange={onFileChange} />
              <CloudUpload sx={{ fontSize: 48, color: TOOL_COLOR, mb: 1 }} />
              <Typography variant="h6">{file ? file.name : 'Drop PDF here or click to upload'}</Typography>
            </Paper>
            {file && <PdfPreview file={file} />}
          </Grid>

          <Grid size={12}>
            <Alert severity="info">
              Extraction runs entirely in your browser: text on each page is clustered into rows and columns by
              position, one worksheet per PDF page. Merged cells, styling, and scanned pages are not detected.
            </Alert>
          </Grid>

          <Grid size={12} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={extract}
              disabled={!file || processing}
              sx={{ bgcolor: TOOL_COLOR, '&:hover': { bgcolor: TOOL_COLOR_DARK } }}
            >
              Extract Tables
            </Button>
            <Button variant="outlined" startIcon={<RestartAlt />} onClick={reset} disabled={processing}>
              Reset
            </Button>
          </Grid>

          {processing && (
            <Grid size={12}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Extracting page {progress.current} of {progress.total}...
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress.total ? (progress.current / progress.total) * 100 : 0}
                sx={{ '& .MuiLinearProgress-bar': { bgcolor: TOOL_COLOR } }}
              />
            </Grid>
          )}

          {pages && totalRows === 0 && (
            <Grid size={12}>
              <Alert severity="warning">No extractable text found. Scanned PDFs need OCR — try the OCR PDF tool.</Alert>
            </Grid>
          )}

          {pages && totalRows > 0 && (
            <Grid size={12}>
              <ExtractionResults
                totalRows={totalRows}
                pageCount={pages.length}
                preview={preview}
                onDownload={download}
              />
            </Grid>
          )}
        </Grid>
      </Container>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </ToolLayout>
  );
}
