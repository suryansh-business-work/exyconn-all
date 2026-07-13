import React, { useState } from 'react';
import { Container, Alert, Snackbar, Button } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ListAlt } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { UrlEntry } from './types';
import GeneratorSettings from './GeneratorSettings';
import BulkUrlInput from './BulkUrlInput';
import UrlEntryList from './UrlEntryList';
import GeneratedOutput from './GeneratedOutput';

const SitemapGenerator: React.FC = () => {
  const [urls, setUrls] = useState<UrlEntry[]>([{ id: '1', loc: '', changefreq: 'weekly', priority: 0.5 }]);
  const [bulkUrls, setBulkUrls] = useState('');
  const [defaultChangefreq, setDefaultChangefreq] = useState('weekly');
  const [defaultPriority, setDefaultPriority] = useState(0.5);
  const [generatedXml, setGeneratedXml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addUrl = () => {
    setUrls([
      ...urls,
      { id: Date.now().toString(), loc: '', changefreq: defaultChangefreq, priority: defaultPriority },
    ]);
  };

  const removeUrl = (id: string) => setUrls(urls.filter((u) => u.id !== id));

  const updateUrl = (id: string, field: keyof UrlEntry, value: string | number) => {
    setUrls(urls.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
  };

  const parseBulkUrls = () => {
    const lines = bulkUrls.split('\n').filter((l) => l.trim());
    const newUrls = lines.map((loc, i) => ({
      id: `bulk-${Date.now()}-${i}`,
      loc: loc.trim(),
      changefreq: defaultChangefreq,
      priority: defaultPriority,
    }));
    setUrls([...urls, ...newUrls]);
    setBulkUrls('');
  };

  const generateXml = () => {
    const validUrls = urls.filter((u) => u.loc.trim());
    if (validUrls.length === 0) {
      setError('Add at least one URL');
      return;
    }

    const urlEntries = validUrls
      .map(
        (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`
      )
      .join('\n');

    setGeneratedXml(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedXml);
    setCopied(true);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
  };

  return (
    <ToolLayout toolName="Sitemap Generator Online" toolIcon={<ListAlt />} toolColor="#3b82f6">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <GeneratorSettings
              defaultChangefreq={defaultChangefreq}
              defaultPriority={defaultPriority}
              onChangefreqChange={setDefaultChangefreq}
              onPriorityChange={setDefaultPriority}
            />
            <BulkUrlInput bulkUrls={bulkUrls} onBulkUrlsChange={setBulkUrls} onParseBulkUrls={parseBulkUrls} />
            <UrlEntryList urls={urls} onAddUrl={addUrl} onRemoveUrl={removeUrl} onUpdateUrl={updateUrl} />
            <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={generateXml} startIcon={<ListAlt />}>
              Generate Sitemap
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <GeneratedOutput generatedXml={generatedXml} onCopy={handleCopy} onDownload={handleDownload} />
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

export default SitemapGenerator;
