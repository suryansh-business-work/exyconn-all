import React, { useState } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { CompareArrows } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import { CompareResult } from './types';
import CompareInputSection from './CompareInputSection';
import CompareResultsTable from './CompareResultsTable';

const SitemapCompare: React.FC = () => {
  const [sitemap1, setSitemap1] = useState('');
  const [sitemap2, setSitemap2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!sitemap1.trim() || !sitemap2.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(APIs.sitemapTools.compare, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitemap1Url: sitemap1, sitemap2Url: sitemap2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Comparison failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="Sitemap Compare Tool" toolIcon={<CompareArrows />} toolColor="#f59e0b">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <CompareInputSection
              sitemap1={sitemap1}
              sitemap2={sitemap2}
              isLoading={isLoading}
              result={result}
              onSitemap1Change={setSitemap1}
              onSitemap2Change={setSitemap2}
              onCompare={handleCompare}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <CompareResultsTable result={result} />
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default SitemapCompare;
