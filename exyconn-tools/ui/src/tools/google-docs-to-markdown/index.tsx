import React, { useState } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { InsertDriveFile } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import UrlInputPanel from './UrlInputPanel';
import MarkdownOutput from './MarkdownOutput';

const GoogleDocsToMarkdown: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!url.trim()) {
      setError('Please enter a Google Docs URL');
      return;
    }
    if (!url.includes('docs.google.com')) {
      setError('Please enter a valid Google Docs URL');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.converterTools.googleDocsToMarkdown, {
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
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'google-doc'}.md`;
    a.click();
  };

  return (
    <ToolLayout toolName="Google Docs to Markdown" toolIcon={<InsertDriveFile />} toolColor="#4285f4">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <UrlInputPanel
              url={url}
              loading={loading}
              title={title}
              onUrlChange={setUrl}
              onConvert={handleConvert}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <MarkdownOutput markdown={markdown} onCopy={handleCopy} onDownload={handleDownload} />
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

export default GoogleDocsToMarkdown;
