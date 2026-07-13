import React, { useState } from 'react';
import { Container, Alert, Snackbar, Button, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DataObject } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import JsonInputPanel from './JsonInputPanel';
import MarkdownOutput from './MarkdownOutput';

const JsonToMarkdown: React.FC = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!content.trim()) {
      setError('Please enter JSON content');
      return;
    }
    try {
      JSON.parse(content);
    } catch {
      setError('Invalid JSON format');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.converterTools.jsonToMarkdown, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
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
    a.download = 'data.md';
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

  const formatJson = () => {
    try {
      const parsed = JSON.parse(content);
      setContent(JSON.stringify(parsed, null, 2));
    } catch {
      setError('Cannot format invalid JSON');
    }
  };

  return (
    <ToolLayout toolName="JSON to Markdown" toolIcon={<DataObject />} toolColor="#3b82f6">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <JsonInputPanel
              content={content}
              onContentChange={setContent}
              onFormat={formatJson}
              onFileUpload={handleFileUpload}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleConvert}
              disabled={!content.trim() || loading}
              startIcon={loading ? <CircularProgress size={16} /> : <DataObject />}
              sx={{ mt: 2, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              {loading ? 'Converting...' : 'Convert to Markdown'}
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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

export default JsonToMarkdown;
