import React, { useState } from 'react';
import { Container, Alert, Snackbar, Paper, Typography } from '@mui/material';
import { Insights } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import { InsightsResult } from './types';
import AnalyzeForm from './AnalyzeForm';
import InsightsResultsGrid from './InsightsResultsGrid';

const SitemapInsights: React.FC = () => {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InsightsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!sitemapUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(APIs.sitemapTools.insights, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sitemapUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="Sitemap Insights Tool" toolIcon={<Insights />} toolColor="#14b8a6">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <AnalyzeForm
          sitemapUrl={sitemapUrl}
          isLoading={isLoading}
          onUrlChange={setSitemapUrl}
          onAnalyze={handleAnalyze}
        />
        {!result ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Insights sx={{ fontSize: 48, mb: 2, opacity: 0.3, color: '#14b8a6' }} />
            <Typography variant="body1" color="text.secondary">
              Enter a sitemap URL to get detailed insights
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Analyze URL patterns, depth, freshness, and more
            </Typography>
          </Paper>
        ) : (
          <InsightsResultsGrid result={result} />
        )}
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default SitemapInsights;
