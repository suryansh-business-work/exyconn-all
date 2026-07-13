import React, { useState } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Link } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import { ExtractResult } from './types';
import ExtractForm from './ExtractForm';
import ExtractSummary from './ExtractSummary';
import UrlResultsTable from './UrlResultsTable';

const SitemapUrlExtractor: React.FC = () => {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExtract = async () => {
    if (!sitemapUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(APIs.sitemapTools.extractUrls, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sitemapUrl, followIndex: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUrls =
    result?.urls.filter((u) => (searchTerm ? u.loc.toLowerCase().includes(searchTerm.toLowerCase()) : true)) || [];

  const handleCopyAll = () => {
    const urls = filteredUrls.map((u) => u.loc).join('\n');
    navigator.clipboard.writeText(urls);
    setCopied(true);
  };

  const handleExportCSV = () => {
    const csv = [
      'URL,Last Modified,Change Frequency,Priority',
      ...filteredUrls.map((u) => `"${u.loc}","${u.lastmod || ''}","${u.changefreq || ''}","${u.priority ?? ''}"`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap-urls.csv';
    a.click();
  };

  return (
    <ToolLayout toolName="Sitemap URL Extractor" toolIcon={<Link />} toolColor="#8b5cf6">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <ExtractForm
              sitemapUrl={sitemapUrl}
              isLoading={isLoading}
              onUrlChange={setSitemapUrl}
              onExtract={handleExtract}
            />
            {result && <ExtractSummary result={result} />}
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <UrlResultsTable
              hasResult={!!result}
              filteredUrls={filteredUrls}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
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

export default SitemapUrlExtractor;
