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
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Language, ContentCopy, Download } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

const WebpageToMarkdown: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(APIs.converterTools.webpageToMarkdown, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = (await res.json()) as {
        success: boolean;
        error?: string;
        data?: { markdown: string; title: string };
      };
      if (!res.ok) throw new Error(data.error || 'Conversion failed');

      setMarkdown(data.data?.markdown || '');
      setTitle(data.data?.title || '');
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
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'webpage'}.md`;
    a.click();
  };

  return (
    <ToolLayout toolName="Webpage to Markdown" toolIcon={<Language />} toolColor="#06b6d4">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Webpage URL
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConvert()}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Enter the URL of a webpage to convert its content to Markdown
              </Typography>
            </Paper>

            <Button
              fullWidth
              variant="contained"
              onClick={handleConvert}
              disabled={!url.trim() || loading}
              startIcon={loading ? <CircularProgress size={16} /> : <Language />}
              sx={{ mt: 2, bgcolor: '#06b6d4', '&:hover': { bgcolor: '#0891b2' } }}
            >
              {loading ? 'Fetching & Converting...' : 'Convert Webpage'}
            </Button>

            {title && (
              <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Page Title
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {title}
                </Typography>
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              elevation={0}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%', minHeight: 450 }}
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
                  <Language sx={{ fontSize: 48, mb: 2, opacity: 0.3, color: '#06b6d4' }} />
                  <Typography variant="body1">Enter a URL to convert</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Extracts main content and converts to clean Markdown
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
                      Converted Markdown
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
                  <Box sx={{ p: 2, maxHeight: 500, overflow: 'auto' }}>
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

export default WebpageToMarkdown;
