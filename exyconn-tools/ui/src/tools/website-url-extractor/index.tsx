import React, { useState } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Link as LinkIcon } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import { ExtractionResult, ExtractedUrl } from './types';
import ExtractorInputSection from './ExtractorInputSection';
import UrlResultsTable from './UrlResultsTable';

const WebsiteUrlExtractor: React.FC = () => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExtract = async () => {
    if (!websiteUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(APIs.websiteTools.extractUrls, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl, maxUrls: 500 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract URLs');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract URLs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAll = (urls: ExtractedUrl[]) => {
    const text = urls.map((u) => u.url).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  const handleExportCSV = (urls: ExtractedUrl[]) => {
    const csv = [
      'URL,Text,Type,Is Resource',
      ...urls.map((u) => `"${u.url}","${u.text.replace(/"/g, '""')}",${u.type},${u.isResource}`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-urls.csv';
    a.click();
  };

  return (
    <ToolLayout toolName="Website URL Extractor" toolIcon={<LinkIcon />} toolColor="#3b82f6">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <ExtractorInputSection
              websiteUrl={websiteUrl}
              isLoading={isLoading}
              result={result}
              onUrlChange={setWebsiteUrl}
              onExtract={handleExtract}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <UrlResultsTable
              urls={result?.urls || []}
              onCopyAll={handleCopyAll}
              onExportCSV={handleExportCSV}
            />
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)}>
        <Alert severity="success">URLs copied to clipboard!</Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default WebsiteUrlExtractor;
