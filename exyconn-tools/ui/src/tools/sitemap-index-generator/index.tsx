import React, { useState } from 'react';
import {
  Container,
  Alert,
  Snackbar,
  Paper,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ListAlt } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import SitemapEntryList from './SitemapEntryList';
import GeneratedXmlOutput from './GeneratedXmlOutput';

interface SitemapEntry {
  id: string;
  loc: string;
  lastmod: string;
}

const SitemapIndexGenerator: React.FC = () => {
  const [sitemaps, setSitemaps] = useState<SitemapEntry[]>([
    { id: '1', loc: '', lastmod: new Date().toISOString().split('T')[0] },
  ]);
  const [generatedXml, setGeneratedXml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addSitemap = () => {
    setSitemaps([...sitemaps, { id: Date.now().toString(), loc: '', lastmod: new Date().toISOString().split('T')[0] }]);
  };

  const removeSitemap = (id: string) => {
    setSitemaps(sitemaps.filter((s) => s.id !== id));
  };

  const updateSitemap = (id: string, field: keyof SitemapEntry, value: string) => {
    setSitemaps(sitemaps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const generateXml = () => {
    const validSitemaps = sitemaps.filter((s) => s.loc.trim());
    if (validSitemaps.length === 0) {
      setError('Add at least one sitemap URL');
      return;
    }

    const sitemapEntries = validSitemaps
      .map(
        (s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;

    setGeneratedXml(xml);
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
    a.download = 'sitemap-index.xml';
    a.click();
  };

  return (
    <ToolLayout toolName="Sitemap Index Generator" toolIcon={<ListAlt />} toolColor="#6366f1">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <SitemapEntryList
                sitemaps={sitemaps}
                onAdd={addSitemap}
                onRemove={removeSitemap}
                onUpdate={updateSitemap}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={generateXml}
                startIcon={<ListAlt />}
                sx={{ mt: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
              >
                Generate Sitemap Index
              </Button>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              elevation={0}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%', minHeight: 450 }}
            >
              <GeneratedXmlOutput
                generatedXml={generatedXml}
                onCopy={handleCopy}
                onDownload={handleDownload}
              />
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

export default SitemapIndexGenerator;
