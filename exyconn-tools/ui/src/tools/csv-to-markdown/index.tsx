import React, { useState } from 'react';
import {
  Container,
  Alert,
  Snackbar,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { TableChart, ContentCopy, Download } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

const CsvToMarkdown: React.FC = () => {
  const [content, setContent] = useState('');
  const [hasHeader, setHasHeader] = useState(true);
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!content.trim()) {
      setError('Please enter CSV content');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(APIs.converterTools.csvToMarkdown, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, hasHeader }),
      });

      const data = (await res.json()) as { success: boolean; error?: string; data?: { markdown: string } };
      if (!res.ok) throw new Error(data.error || 'Conversion failed');

      setMarkdown(data.data?.markdown || '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table.md';
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <ToolLayout toolName="CSV to Markdown" toolIcon={<TableChart />} toolColor="#10b981">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  CSV Content
                </Typography>
                <Button component="label" size="small" variant="outlined">
                  Upload CSV
                  <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
                </Button>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={12}
                placeholder="Paste your CSV content here...&#10;&#10;Example:&#10;Name,Email,Phone&#10;John Doe,john@example.com,555-1234&#10;Jane Smith,jane@example.com,555-5678"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{ fontFamily: 'monospace' }}
              />
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={<Switch checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />}
                  label="First row is header"
                />
              </Box>
            </Paper>

            <Button
              fullWidth
              variant="contained"
              onClick={handleConvert}
              disabled={!content.trim() || loading}
              startIcon={loading ? <CircularProgress size={16} /> : <TableChart />}
              sx={{ mt: 2, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              {loading ? 'Converting...' : 'Convert to Markdown Table'}
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%', minHeight: 400 }}
            >
              {!markdown ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    color: 'text.secondary',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <TableChart sx={{ fontSize: 48, mb: 2, opacity: 0.3, color: '#10b981' }} />
                  <Typography variant="body1">Paste CSV content to convert</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    The Markdown table will appear here
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box
                    sx={{
                      p: 1.5,
                      borderBottom: 1,
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      Markdown Table
                    </Typography>
                    <Box>
                      <Tooltip title="Copy">
                        <IconButton size="small" onClick={handleCopy}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={handleDownload}>
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13 }}>
                      {markdown}
                    </pre>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)}>
        <Alert severity="success">Copied to clipboard!</Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default CsvToMarkdown;
