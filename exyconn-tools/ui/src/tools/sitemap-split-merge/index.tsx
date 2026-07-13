import React, { useState } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { CallSplit } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import { SplitResult } from './types';
import SplitForm from './SplitForm';
import SplitSummary from './SplitSummary';
import SplitResultsPanel from './SplitResultsPanel';

const SitemapSplitMerge: React.FC = () => {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [urlsPerFile, setUrlsPerFile] = useState(10000);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SplitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSplit = async () => {
    if (!sitemapUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(APIs.sitemapTools.split, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sitemapUrl, urlsPerFile, baseFileName: 'sitemap' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Split failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Split failed');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const downloadAll = () => {
    if (!result) return;
    result.sitemaps.forEach((s) => downloadFile(s.content, `sitemap-${s.index}.xml`));
    downloadFile(result.indexFile, 'sitemap-index.xml');
  };

  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
  };

  return (
    <ToolLayout toolName="Sitemap Split & Merge" toolIcon={<CallSplit />} toolColor="#ec4899">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <SplitForm
              sitemapUrl={sitemapUrl}
              urlsPerFile={urlsPerFile}
              isLoading={isLoading}
              onUrlChange={setSitemapUrl}
              onUrlsPerFileChange={setUrlsPerFile}
              onSplit={handleSplit}
            />
            {result && <SplitSummary result={result} onDownloadAll={downloadAll} />}
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <SplitResultsPanel result={result} onDownloadFile={downloadFile} onCopyContent={copyContent} />
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

export default SitemapSplitMerge;
